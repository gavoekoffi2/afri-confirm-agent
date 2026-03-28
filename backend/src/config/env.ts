import dotenv from "dotenv";
dotenv.config();

function required(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

export const env = {
  port: parseInt(process.env.PORT || "3002"),
  nodeEnv: process.env.NODE_ENV || "development",

  // Database
  databaseUrl: required("DATABASE_URL"),

  // Redis
  redisUrl: process.env.REDIS_URL || "redis://localhost:6379",

  // Twilio
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || "",
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || "",
  twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER || "",

  // OpenAI
  openaiApiKey: process.env.OPENAI_API_KEY || "",

  // ElevenLabs (optional, fallback to Twilio TTS)
  elevenLabsApiKey: process.env.ELEVENLABS_API_KEY || "",

  // App
  appUrl: process.env.APP_URL || "http://localhost:3002",
  adminSecret: process.env.ADMIN_SECRET || "change-me-in-production",
  webhookSecret: process.env.WEBHOOK_SECRET || "",

  // Feature flags
  useTwiloTts: process.env.USE_TWILIO_TTS === "true",
  callDelaySeconds: parseInt(process.env.CALL_DELAY_SECONDS || "5"),
  maxRetryAttempts: parseInt(process.env.MAX_RETRY_ATTEMPTS || "3"),
  retryDelayMinutes: parseInt(process.env.RETRY_DELAY_MINUTES || "30"),
};
