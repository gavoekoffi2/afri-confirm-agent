import { Queue, Worker, Job } from "bullmq";
import IORedis from "ioredis";
import { env } from "../config/env";
import { prisma } from "../config/prisma";
import { initiateCall } from "./voice";

const connection = new IORedis(env.redisUrl, { maxRetriesPerRequest: null });

const callQueue = new Queue("call-confirm", { connection });

export async function enqueueCall(callJobId: string, delaySeconds = 5): Promise<void> {
  await callQueue.add(
    "initiate-call",
    { callJobId },
    { delay: delaySeconds * 1000, attempts: 1 },
  );
}

// ── Worker ──
export function startCallWorker(): void {
  const worker = new Worker(
    "call-confirm",
    async (job: Job<{ callJobId: string }>) => {
      const { callJobId } = job.data;
      const callJob = await prisma.callJob.findUnique({ where: { id: callJobId } });
      if (!callJob) return;
      if (callJob.status !== "PENDING" && callJob.status !== "RETRYING") return;

      const shop = await prisma.shop.findUnique({ where: { domain: callJob.shopifyShopDomain } });
      const items = callJob.items as { name: string; quantity: number }[];

      console.log(`[Queue] Initiating call for job ${callJobId}, phone: ${callJob.customerPhone}`);

      await prisma.callJob.update({
        where: { id: callJobId },
        data: { status: "CALLING", calledAt: new Date() },
      });

      try {
        const callSid = await initiateCall({
          to: callJob.customerPhone,
          callJobId: callJob.id,
          customerName: callJob.customerName,
          orderTotal: callJob.orderTotal,
          currency: callJob.currency,
          items,
          agentName: shop?.agentName || "Aïssa",
          language: shop?.agentLanguage || "fr",
        });

        await prisma.callJob.update({
          where: { id: callJobId },
          data: { twilioCallSid: callSid, attempts: callJob.attempts + 1 },
        });

        console.log(`[Queue] Call initiated: ${callSid}`);
      } catch (err: any) {
        console.error(`[Queue] Call failed for job ${callJobId}:`, err.message);
        const attempts = callJob.attempts + 1;
        if (attempts < callJob.maxAttempts) {
          await prisma.callJob.update({
            where: { id: callJobId },
            data: { status: "RETRYING", attempts, scheduledAt: new Date(Date.now() + env.retryDelayMinutes * 60 * 1000) },
          });
          await enqueueCall(callJobId, env.retryDelayMinutes * 60);
        } else {
          await prisma.callJob.update({
            where: { id: callJobId },
            data: { status: "FAILED", attempts, completedAt: new Date(), notes: err.message },
          });
        }
      }
    },
    { connection, concurrency: 3 },
  );

  worker.on("ready", () => console.log("[CallWorker] Ready"));
  worker.on("failed", (job, err) => console.error(`[CallWorker] Job ${job?.id} failed:`, err.message));

  // Reschedule pending RETRYING jobs on startup
  prisma.callJob
    .findMany({ where: { status: "RETRYING", scheduledAt: { lte: new Date() } } })
    .then((jobs) => {
      jobs.forEach((j) => enqueueCall(j.id, 5));
      if (jobs.length > 0) console.log(`[CallWorker] Rescheduled ${jobs.length} retry jobs`);
    })
    .catch(console.error);
}
