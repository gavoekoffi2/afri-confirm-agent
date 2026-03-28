import OpenAI from "openai";
import { env } from "../config/env";

const openai = new OpenAI({ apiKey: env.openaiApiKey });

const POSITIVE_KEYWORDS = ["oui", "yes", "confirme", "confirmé", "d'accord", "ok", "bien", "correct", "exact", "valide", "validé", "accepte", "1"];
const NEGATIVE_KEYWORDS = ["non", "no", "annule", "annulé", "cancel", "pas", "refuse", "refusé", "2"];

/**
 * Analyze customer speech to determine intent (confirm/cancel/unclear).
 */
export async function analyzeIntent(
  speechText: string,
  context: { customerName: string; orderTotal: number; currency: string },
): Promise<"confirm" | "cancel" | "unclear"> {
  const text = speechText.toLowerCase().trim();

  // Quick keyword check before calling LLM
  for (const kw of POSITIVE_KEYWORDS) {
    if (text.includes(kw)) return "confirm";
  }
  for (const kw of NEGATIVE_KEYWORDS) {
    if (text.includes(kw)) return "cancel";
  }

  // Use LLM for ambiguous responses
  if (!env.openaiApiKey) return "unclear";

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Tu es un assistant qui analyse des réponses vocales de clients africains (Côte d'Ivoire, Sénégal, Cameroun, etc.) pour déterminer s'ils veulent CONFIRMER ou ANNULER leur commande e-commerce. Réponds uniquement par: "confirm", "cancel", ou "unclear".`,
        },
        {
          role: "user",
          content: `Le client ${context.customerName} a été appelé pour confirmer sa commande de ${context.orderTotal} ${context.currency}. Il a dit: "${speechText}". Quelle est son intention?`,
        },
      ],
      max_tokens: 10,
      temperature: 0,
    });

    const intent = completion.choices[0].message.content?.toLowerCase().trim();
    if (intent === "confirm") return "confirm";
    if (intent === "cancel") return "cancel";
  } catch (err) {
    console.error("[Conversation] LLM error:", err);
  }

  return "unclear";
}

/**
 * Detect if the call was answered by an answering machine.
 */
export function isAnsweringMachine(twilioAnsweredBy: string | null): boolean {
  return twilioAnsweredBy === "machine_start" || twilioAnsweredBy === "fax";
}
