import twilio from "twilio";
import { env } from "../config/env";

const client = twilio(env.twilioAccountSid, env.twilioAuthToken);

export interface CallParams {
  to: string;
  callJobId: string;
  customerName: string;
  orderTotal: number;
  currency: string;
  items: { name: string; quantity: number }[];
  agentName: string;
  language: string;
}

/**
 * Initiate an outbound call to confirm an order.
 * Twilio will hit our /api/calls/twiml/:callJobId endpoint to get instructions.
 */
export async function initiateCall(params: CallParams): Promise<string> {
  const twimlUrl = `${env.appUrl}/api/calls/twiml/${params.callJobId}`;

  const call = await client.calls.create({
    to: params.to,
    from: env.twilioPhoneNumber,
    url: twimlUrl,
    statusCallback: `${env.appUrl}/api/calls/status/${params.callJobId}`,
    statusCallbackMethod: "POST",
    timeout: 30,
    machineDetection: "Enable",
    machineDetectionTimeout: 5000,
  });

  return call.sid;
}

/**
 * Generate TwiML for the initial greeting.
 */
export function buildGreetingTwiml(params: {
  callJobId: string;
  customerName: string;
  orderTotal: number;
  currency: string;
  agentName: string;
  language: string;
}): string {
  const VoiceResponse = twilio.twiml.VoiceResponse;
  const response = new VoiceResponse();

  const greeting = buildGreetingText(params);
  const gatherUrl = `${env.appUrl}/api/calls/gather/${params.callJobId}`;

  const gather = response.gather({
    input: ["speech"],
    action: gatherUrl,
    method: "POST",
    timeout: 5,
    speechTimeout: "auto",
    language: params.language === "fr" ? "fr-FR" : "en-US",
  });

  gather.say({ voice: "Polly.Lea", language: "fr-FR" }, greeting);

  // If no input, repeat once
  response.say(
    { voice: "Polly.Lea", language: "fr-FR" },
    "Je n'ai pas entendu votre réponse. Appuyez sur 1 pour confirmer ou 2 pour annuler.",
  );
  response.gather({
    input: ["dtmf"],
    action: gatherUrl,
    method: "POST",
    numDigits: 1,
    timeout: 10,
  });

  return response.toString();
}

function buildGreetingText(params: {
  customerName: string;
  orderTotal: number;
  currency: string;
  agentName: string;
}): string {
  const { customerName, orderTotal, currency, agentName } = params;
  const firstName = customerName.split(" ")[0];
  return (
    `Bonjour ${firstName}, je suis ${agentName}, l'assistante de notre boutique. ` +
    `Je vous appelle pour confirmer votre commande de ${orderTotal.toLocaleString("fr-FR")} ${currency}. ` +
    `Souhaitez-vous confirmer cette commande ? ` +
    `Dites oui ou confirmé pour valider, ou non pour annuler.`
  );
}

export function buildConfirmTwiml(): string {
  const VoiceResponse = twilio.twiml.VoiceResponse;
  const response = new VoiceResponse();
  response.say(
    { voice: "Polly.Lea", language: "fr-FR" },
    "Parfait ! Votre commande est bien confirmée. Nous vous livrerons très prochainement. Merci et bonne journée !",
  );
  response.hangup();
  return response.toString();
}

export function buildCancelTwiml(): string {
  const VoiceResponse = twilio.twiml.VoiceResponse;
  const response = new VoiceResponse();
  response.say(
    { voice: "Polly.Lea", language: "fr-FR" },
    "D'accord, votre commande a bien été annulée. N'hésitez pas à commander à nouveau sur notre boutique. Merci et bonne journée !",
  );
  response.hangup();
  return response.toString();
}

export function buildNoAnswerTwiml(): string {
  const VoiceResponse = twilio.twiml.VoiceResponse;
  const response = new VoiceResponse();
  response.say(
    { voice: "Polly.Lea", language: "fr-FR" },
    "Nous n'avons pas pu vous joindre. Nous vous rappellerons prochainement. Merci.",
  );
  response.hangup();
  return response.toString();
}
