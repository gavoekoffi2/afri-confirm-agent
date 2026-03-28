import { Router, Request, Response } from "express";
import crypto from "crypto";
import { prisma } from "../config/prisma";
import { enqueueCall } from "../services/queue";
import { env } from "../config/env";

const router = Router();

// ── POST /api/webhooks/shopify — Shopify order created webhook ──
router.post("/shopify", async (req: Request, res: Response) => {
  try {
    // Verify Shopify HMAC signature
    const shopDomain = req.headers["x-shopify-shop-domain"] as string;
    const hmacHeader = req.headers["x-shopify-hmac-sha256"] as string;
    const topic = req.headers["x-shopify-topic"] as string;

    if (topic !== "orders/create") {
      return res.sendStatus(200); // Ignore other topics
    }

    const shop = await prisma.shop.findUnique({ where: { domain: shopDomain } });
    if (!shop || !shop.active) {
      return res.status(403).json({ error: "Shop not registered" });
    }

    // Verify HMAC
    const body = JSON.stringify(req.body);
    const expectedHmac = crypto
      .createHmac("sha256", shop.webhookSecret)
      .update(body)
      .digest("base64");

    if (hmacHeader !== expectedHmac) {
      console.warn(`[Webhook] Invalid HMAC for shop ${shopDomain}`);
      return res.status(401).json({ error: "Invalid signature" });
    }

    const order = req.body;

    // Only process pending/COD orders
    const financialStatus = order.financial_status;
    if (!["pending", "authorized"].includes(financialStatus)) {
      return res.sendStatus(200);
    }

    // Extract customer phone
    const phone = order.shipping_address?.phone || order.billing_address?.phone || order.customer?.phone;
    if (!phone) {
      console.warn(`[Webhook] Order ${order.id} has no phone number`);
      return res.sendStatus(200);
    }

    // Format phone for Africa (ensure E.164)
    const formattedPhone = formatPhone(phone, shopDomain);
    if (!formattedPhone) {
      console.warn(`[Webhook] Could not format phone: ${phone}`);
      return res.sendStatus(200);
    }

    // Create call job
    const items = (order.line_items || []).map((item: any) => ({
      name: item.title,
      quantity: item.quantity,
      price: item.price,
    }));

    const callJob = await prisma.callJob.create({
      data: {
        shopifyOrderId: String(order.id),
        shopifyShopDomain: shopDomain,
        customerPhone: formattedPhone,
        customerName: `${order.customer?.first_name || ""} ${order.customer?.last_name || ""}`.trim() || "Client",
        orderTotal: parseFloat(order.total_price),
        currency: order.currency || "XOF",
        items,
        scheduledAt: new Date(Date.now() + env.callDelaySeconds * 1000),
      },
    });

    // Queue the call
    await enqueueCall(callJob.id, env.callDelaySeconds);
    console.log(`[Webhook] Queued call for order ${order.id}, phone ${formattedPhone}`);

    return res.sendStatus(200);
  } catch (err) {
    console.error("[Webhook] Error:", err);
    return res.status(500).json({ error: "Internal error" });
  }
});

// ── POST /api/webhooks/register — Register a Shopify shop ──
router.post("/register", async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${env.adminSecret}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { domain, accessToken, webhookSecret, agentName, agentLanguage } = req.body;
  if (!domain || !accessToken || !webhookSecret) {
    return res.status(400).json({ error: "domain, accessToken, and webhookSecret are required" });
  }

  const shop = await prisma.shop.upsert({
    where: { domain },
    create: { domain, accessToken, webhookSecret, agentName: agentName || "Aïssa", agentLanguage: agentLanguage || "fr" },
    update: { accessToken, webhookSecret, agentName: agentName || "Aïssa", agentLanguage: agentLanguage || "fr", active: true },
  });

  return res.json({ shop: { id: shop.id, domain: shop.domain, active: shop.active } });
});

// ── GET /api/webhooks/stats — Quick stats ──
router.get("/stats", async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${env.adminSecret}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const [total, confirmed, cancelled, pending, noAnswer] = await Promise.all([
    prisma.callJob.count(),
    prisma.callJob.count({ where: { status: "CONFIRMED" } }),
    prisma.callJob.count({ where: { status: "CANCELLED" } }),
    prisma.callJob.count({ where: { status: { in: ["PENDING", "CALLING", "RETRYING"] } } }),
    prisma.callJob.count({ where: { status: "NO_ANSWER" } }),
  ]);

  return res.json({ total, confirmed, cancelled, pending, noAnswer, confirmRate: total > 0 ? ((confirmed / total) * 100).toFixed(1) : "0" });
});

function formatPhone(phone: string, shopDomain: string): string | null {
  // Remove spaces, dashes, dots
  let cleaned = phone.replace(/[\s\-\.\(\)]/g, "");

  // If already E.164
  if (cleaned.startsWith("+")) return cleaned;

  // Detect country from shop domain or default to Côte d'Ivoire (+225)
  const countryPrefixes: Record<string, string> = {
    ".ci": "+225", ".sn": "+221", ".cm": "+237", ".ml": "+223",
    ".bf": "+226", ".gn": "+224", ".tg": "+228", ".bj": "+229",
    ".ng": "+234", ".gh": "+233", ".ma": "+212",
  };

  let prefix = "+225"; // Default: Côte d'Ivoire
  for (const [tld, pfx] of Object.entries(countryPrefixes)) {
    if (shopDomain.includes(tld)) { prefix = pfx; break; }
  }

  // Remove leading 0
  if (cleaned.startsWith("0")) cleaned = cleaned.slice(1);

  return `${prefix}${cleaned}`;
}

export default router;
