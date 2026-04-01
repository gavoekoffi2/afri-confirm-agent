"use client";

import { useState } from "react";

interface SimulateResponse {
  status: string;
  customer?: { name: string; orderTotal: number; currency: string; items: string };
  agent_greeting?: string;
  customer_response?: string;
  detected_intent?: string;
  agent_reply?: string;
  order_status?: string;
  instructions?: string;
  example?: Record<string, unknown>;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://confirm-api.finablasolution.cloud/api";

export default function DemoPage() {
  const [step, setStep] = useState<"form" | "greeting" | "response" | "result">("form");
  const [loading, setLoading] = useState(false);
  const [customerName, setCustomerName] = useState("Kouamé Brou");
  const [orderTotal, setOrderTotal] = useState("18500");
  const [currency, setCurrency] = useState("FCFA");
  const [items, setItems] = useState("Sneakers Air Max, Casquette NY");
  const [greeting, setGreeting] = useState("");
  const [customerResponse, setCustomerResponse] = useState("");
  const [result, setResult] = useState<SimulateResponse | null>(null);
  const [error, setError] = useState("");

  async function startDemo() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/demo/simulate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          orderTotal: parseFloat(orderTotal),
          currency,
          items: items.split(",").map((i) => i.trim()),
        }),
      });
      const data: SimulateResponse = await res.json();
      setGreeting(data.agent_greeting || "");
      setStep("greeting");
    } catch {
      setError("Erreur de connexion au serveur. Vérifiez que le backend est accessible.");
    } finally {
      setLoading(false);
    }
  }

  async function sendResponse() {
    if (!customerResponse.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/demo/simulate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          orderTotal: parseFloat(orderTotal),
          currency,
          items: items.split(",").map((i) => i.trim()),
          customerResponse,
        }),
      });
      const data: SimulateResponse = await res.json();
      setResult(data);
      setStep("result");
    } catch {
      setError("Erreur lors de l'envoi de la réponse.");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setStep("form");
    setGreeting("");
    setCustomerResponse("");
    setResult(null);
    setError("");
  }

  const intentColor = result?.detected_intent === "confirm"
    ? "text-green-400" : result?.detected_intent === "cancel"
    ? "text-red-400" : "text-yellow-400";

  const orderStatusBg = result?.order_status === "confirmed"
    ? "bg-green-900/30 border-green-800/50"
    : result?.order_status === "cancelled"
    ? "bg-red-900/30 border-red-800/50"
    : "bg-yellow-900/30 border-yellow-800/50";

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-green-500 flex items-center justify-center font-bold text-sm">AC</div>
            <span className="font-bold text-lg">AfriConfirm</span>
          </div>
          <a href="/" className="text-sm text-gray-400 hover:text-white transition-colors">← Accueil</a>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/30 text-green-400 text-sm px-4 py-1.5 rounded-full mb-4">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            Simulation en direct
          </div>
          <h1 className="text-3xl font-bold mb-3">Testez AfriConfirm maintenant</h1>
          <p className="text-gray-400">Simulez un appel de confirmation COD sans avoir besoin de Twilio.</p>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-800 rounded-xl p-4 mb-6 text-red-400 text-sm">
            {error}
          </div>
        )}

        {step === "form" && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
            <h2 className="font-semibold text-lg mb-6">Détails de la commande</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Nom du client</label>
                <input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Montant</label>
                  <input
                    value={orderTotal}
                    onChange={(e) => setOrderTotal(e.target.value)}
                    type="number"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Devise</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-500"
                  >
                    <option>FCFA</option>
                    <option>XOF</option>
                    <option>NGN</option>
                    <option>GHS</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Articles (séparés par virgule)</label>
                <input
                  value={items}
                  onChange={(e) => setItems(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-500"
                />
              </div>
            </div>
            <button
              onClick={startDemo}
              disabled={loading}
              className="w-full mt-6 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl transition-colors"
            >
              {loading ? "Connexion en cours..." : "Démarrer la simulation →"}
            </button>
          </div>
        )}

        {step === "greeting" && (
          <div className="space-y-6">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-green-500/20 border border-green-500/50 rounded-full flex items-center justify-center text-sm">🤖</div>
                <span className="text-green-400 font-medium text-sm">Agent AfriConfirm</span>
              </div>
              <p className="text-gray-200 leading-relaxed text-lg italic">&ldquo;{greeting}&rdquo;</p>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <label className="text-sm text-gray-400 mb-3 block">Que répond {customerName} ?</label>
              <div className="flex gap-3 mb-3">
                {["Oui je confirme", "Non je veux annuler", "C'est quoi ce numéro ?"].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setCustomerResponse(preset)}
                    className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    {preset}
                  </button>
                ))}
              </div>
              <input
                value={customerResponse}
                onChange={(e) => setCustomerResponse(e.target.value)}
                placeholder="Tapez la réponse du client..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-500"
                onKeyDown={(e) => e.key === "Enter" && sendResponse()}
              />
              <button
                onClick={sendResponse}
                disabled={loading || !customerResponse.trim()}
                className="w-full mt-4 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl transition-colors"
              >
                {loading ? "Analyse en cours..." : "Envoyer la réponse →"}
              </button>
            </div>
          </div>
        )}

        {step === "result" && result && (
          <div className="space-y-4">
            <div className={`border rounded-2xl p-6 ${orderStatusBg}`}>
              <div className="text-center mb-4">
                <div className="text-4xl mb-2">{result.order_status === "confirmed" ? "✅" : result.order_status === "cancelled" ? "❌" : "🔄"}</div>
                <h2 className="font-bold text-xl">
                  Commande{" "}
                  <span className={intentColor}>
                    {result.order_status === "confirmed" ? "CONFIRMÉE" : result.order_status === "cancelled" ? "ANNULÉE" : "EN ATTENTE"}
                  </span>
                </h2>
              </div>
              <div className="text-sm text-gray-400 text-center">
                Intention détectée : <span className={`font-medium ${intentColor}`}>{result.detected_intent}</span>
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-green-500/20 border border-green-500/50 rounded-full flex items-center justify-center text-sm">🤖</div>
                <span className="text-green-400 font-medium text-sm">Réponse de l&apos;agent</span>
              </div>
              <p className="text-gray-200 italic">&ldquo;{result.agent_reply}&rdquo;</p>
            </div>

            <div className="bg-gray-800/50 rounded-xl p-4 text-sm">
              <div className="text-gray-400 mb-2 font-medium">Résumé de l&apos;appel</div>
              <div className="space-y-1 text-gray-300">
                <div>Client : <span className="text-white">{result.customer?.name}</span></div>
                <div>Commande : <span className="text-white">{result.customer?.orderTotal?.toLocaleString()} {result.customer?.currency}</span></div>
                <div>Articles : <span className="text-white">{result.customer?.items}</span></div>
                <div>Réponse client : <span className="text-white italic">&ldquo;{result.customer_response}&rdquo;</span></div>
              </div>
            </div>

            <button
              onClick={reset}
              className="w-full border border-gray-700 hover:border-gray-500 text-gray-300 py-3.5 rounded-xl font-medium transition-colors"
            >
              Nouvelle simulation
            </button>

            <div className="text-center mt-6 pt-6 border-t border-gray-800">
              <p className="text-gray-400 mb-4">Prêt à intégrer AfriConfirm à votre boutique Shopify ?</p>
              <a
                href="mailto:contact@finablasolution.cloud"
                className="bg-green-500 hover:bg-green-600 text-white font-semibold px-8 py-3 rounded-xl transition-colors inline-block"
              >
                Contacter l&apos;équipe →
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
