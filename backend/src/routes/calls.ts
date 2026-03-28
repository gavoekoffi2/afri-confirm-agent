import { Router, Request, Response } from "express";
import { prisma } from "../config/prisma";
import {
  buildGreetingTwiml,
  buildConfirmTwiml,
  buildCancelTwiml,
  buildNoAnswerTwiml,
} from "../services/voice";
import { analyzeIntent, isAnsweringMachine } from "../services/conversation";
import { env } from "../config/env";

const router = Router();

// ── GET /api/calls/twiml/:callJobId — Initial TwiML greeting ──
router.post("/twiml/:callJobId", async (req: Request, res: Response) => {
  const job = await prisma.callJob.findUnique({ where: { id: req.params.callJobId } });
  if (!job) return res.status(404).send("<Response><Say>Désolé, erreur interne.</Say></Response>");

  const shop = await prisma.shop.findUnique({ where: { domain: job.shopifyShopDomain } });

  // Check if answering machine
  if (isAnsweringMachine(req.body.AnsweredBy)) {
    await prisma.callJob.update({
      where: { id: job.id },
      data: { status: "NO_ANSWER", completedAt: new Date(), notes: "Answering machine" },
    });
    res.set("Content-Type", "text/xml");
    return res.send(buildNoAnswerTwiml());
  }

  const items = job.items as { name: string; quantity: number }[];
  const twiml = buildGreetingTwiml({
    callJobId: job.id,
    customerName: job.customerName,
    orderTotal: job.orderTotal,
    currency: job.currency,
    agentName: shop?.agentName || "Aïssa",
    language: shop?.agentLanguage || "fr",
  });

  res.set("Content-Type", "text/xml");
  return res.send(twiml);
});

// ── POST /api/calls/gather/:callJobId — Handle speech/DTMF input ──
router.post("/gather/:callJobId", async (req: Request, res: Response) => {
  const job = await prisma.callJob.findUnique({ where: { id: req.params.callJobId } });
  if (!job) return res.status(404).send("<Response><Hangup/></Response>");

  const speechResult = req.body.SpeechResult as string | undefined;
  const digits = req.body.Digits as string | undefined;

  let intent: "confirm" | "cancel" | "unclear" = "unclear";

  if (digits === "1") {
    intent = "confirm";
  } else if (digits === "2") {
    intent = "cancel";
  } else if (speechResult) {
    intent = await analyzeIntent(speechResult, {
      customerName: job.customerName,
      orderTotal: job.orderTotal,
      currency: job.currency,
    });
  }

  // Update transcript
  const transcripts = (job.transcripts as string[]) || [];
  transcripts.push(`Customer: ${speechResult || `DTMF:${digits}`} → Intent: ${intent}`);

  if (intent === "confirm") {
    await prisma.callJob.update({
      where: { id: job.id },
      data: { status: "CONFIRMED", outcome: "confirmed", transcripts, completedAt: new Date() },
    });
    // Update Shopify order status
    updateShopifyOrder(job.shopifyOrderId, job.shopifyShopDomain, "confirmed").catch(console.error);
    res.set("Content-Type", "text/xml");
    return res.send(buildConfirmTwiml());
  }

  if (intent === "cancel") {
    await prisma.callJob.update({
      where: { id: job.id },
      data: { status: "CANCELLED", outcome: "cancelled", transcripts, completedAt: new Date() },
    });
    updateShopifyOrder(job.shopifyOrderId, job.shopifyShopDomain, "cancelled").catch(console.error);
    res.set("Content-Type", "text/xml");
    return res.send(buildCancelTwiml());
  }

  // Unclear — ask again
  await prisma.callJob.update({ where: { id: job.id }, data: { transcripts } });
  const shop = await prisma.shop.findUnique({ where: { domain: job.shopifyShopDomain } });
  const items = job.items as { name: string; quantity: number }[];
  res.set("Content-Type", "text/xml");
  return res.send(buildGreetingTwiml({
    callJobId: job.id,
    customerName: job.customerName,
    orderTotal: job.orderTotal,
    currency: job.currency,
    agentName: shop?.agentName || "Aïssa",
    language: shop?.agentLanguage || "fr",
  }));
});

// ── POST /api/calls/status/:callJobId — Twilio call status webhook ──
router.post("/status/:callJobId", async (req: Request, res: Response) => {
  const callStatus = req.body.CallStatus as string;
  const job = await prisma.callJob.findUnique({ where: { id: req.params.callJobId } });
  if (!job) return res.sendStatus(200);

  if (callStatus === "no-answer" || callStatus === "busy") {
    const attempts = job.attempts + 1;
    if (attempts < job.maxAttempts) {
      await prisma.callJob.update({
        where: { id: job.id },
        data: {
          status: "RETRYING",
          attempts,
          scheduledAt: new Date(Date.now() + env.retryDelayMinutes * 60 * 1000),
        },
      });
    } else {
      await prisma.callJob.update({
        where: { id: job.id },
        data: { status: "NO_ANSWER", attempts, completedAt: new Date() },
      });
    }
  } else if (callStatus === "failed") {
    await prisma.callJob.update({
      where: { id: job.id },
      data: { status: "FAILED", completedAt: new Date() },
    });
  }

  return res.sendStatus(200);
});

// ── GET /api/calls — List calls (admin) ──
router.get("/", async (req: Request, res: Response) => {
  const { status, domain, limit = "50", offset = "0" } = req.query;
  const where: any = {};
  if (status) where.status = status;
  if (domain) where.shopifyShopDomain = domain;

  const [jobs, total] = await Promise.all([
    prisma.callJob.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    }),
    prisma.callJob.count({ where }),
  ]);

  return res.json({ jobs, total });
});

async function updateShopifyOrder(orderId: string, shopDomain: string, action: "confirmed" | "cancelled") {
  const shop = await prisma.shop.findUnique({ where: { domain: shopDomain } });
  if (!shop) return;

  const { default: axios } = await import("axios");
  const baseUrl = `https://${shopDomain}/admin/api/2024-01/orders/${orderId}`;

  if (action === "cancelled") {
    await axios.post(
      `${baseUrl}/cancel.json`,
      {},
      { headers: { "X-Shopify-Access-Token": shop.accessToken, "Content-Type": "application/json" } },
    );
  } else {
    // Tag the order as confirmed by agent
    await axios.put(
      `${baseUrl}.json`,
      { order: { id: orderId, tags: "agent-confirmed", note_attributes: [{ name: "agent_status", value: "confirmed" }] } },
      { headers: { "X-Shopify-Access-Token": shop.accessToken, "Content-Type": "application/json" } },
    );
  }
}

export default router;
