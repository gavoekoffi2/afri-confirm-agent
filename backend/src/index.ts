import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { env } from "./config/env";
import { prisma } from "./config/prisma";
import webhookRoutes from "./routes/webhooks";
import callRoutes from "./routes/calls";
import { startCallWorker } from "./services/queue";

const app = express();

// Security
app.use(helmet());
app.set("trust proxy", 1);
app.use(cors({ origin: env.appUrl }));

// Rate limiting
app.use("/api/webhooks", rateLimit({ windowMs: 60 * 1000, max: 200 }));
app.use("/api/calls", rateLimit({ windowMs: 60 * 1000, max: 500 }));

// Body parsing — Twilio sends URL-encoded, Shopify sends JSON
app.use("/api/calls/twiml", express.urlencoded({ extended: false }));
app.use("/api/calls/gather", express.urlencoded({ extended: false }));
app.use("/api/calls/status", express.urlencoded({ extended: false }));
app.use(express.json());

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "afri-confirm-agent", timestamp: new Date().toISOString() });
});

// Routes
app.use("/api/webhooks", webhookRoutes);
app.use("/api/calls", callRoutes);

// Start
async function start() {
  try {
    await prisma.$connect();
    console.log("[DB] Connected");

    startCallWorker();
    console.log("[Queue] Call worker started");

    app.listen(env.port, () => {
      console.log(`[AfriConfirm] API running on port ${env.port} (${env.nodeEnv})`);
    });
  } catch (err) {
    console.error("[Start] Failed:", err);
    process.exit(1);
  }
}

start();

export default app;
