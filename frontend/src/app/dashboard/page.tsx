"use client";

import { useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002/api";
const ADMIN_SECRET = process.env.NEXT_PUBLIC_ADMIN_SECRET || "";

interface Stats {
  total: number;
  confirmed: number;
  cancelled: number;
  pending: number;
  noAnswer: number;
  confirmRate: string;
}

interface CallJob {
  id: string;
  shopifyOrderId: string;
  shopifyShopDomain: string;
  customerPhone: string;
  customerName: string;
  orderTotal: number;
  currency: string;
  status: string;
  attempts: number;
  createdAt: string;
  completedAt: string | null;
  outcome: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  CONFIRMED: "bg-green-600",
  CANCELLED: "bg-red-600",
  PENDING: "bg-blue-600",
  CALLING: "bg-yellow-600",
  NO_ANSWER: "bg-gray-600",
  FAILED: "bg-red-800",
  RETRYING: "bg-orange-600",
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [calls, setCalls] = useState<CallJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  async function load() {
    setLoading(true);
    try {
      const [statsRes, callsRes] = await Promise.all([
        fetch(`${API_BASE}/webhooks/stats`, { headers: { Authorization: `Bearer ${ADMIN_SECRET}` } }),
        fetch(`${API_BASE}/calls?limit=50${filter !== "all" ? `&status=${filter}` : ""}`, { headers: { Authorization: `Bearer ${ADMIN_SECRET}` } }),
      ]);
      if (statsRes.ok) setStats(await statsRes.json());
      if (callsRes.ok) { const d = await callsRes.json(); setCalls(d.jobs || []); }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [filter]);
  useEffect(() => { const iv = setInterval(load, 10000); return () => clearInterval(iv); }, [filter]);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center font-bold text-sm">AC</div>
            <span className="font-bold">AfriConfirm — Dashboard</span>
          </div>
          <button onClick={load} className="text-sm text-gray-400 hover:text-white">Actualiser</button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <StatCard label="Total appels" value={stats.total} color="text-white" />
            <StatCard label="Confirmés" value={stats.confirmed} color="text-green-400" />
            <StatCard label="Annulés" value={stats.cancelled} color="text-red-400" />
            <StatCard label="En attente" value={stats.pending} color="text-blue-400" />
            <StatCard label="Taux confirm." value={`${stats.confirmRate}%`} color="text-green-400" isString />
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          {["all", "PENDING", "CALLING", "CONFIRMED", "CANCELLED", "NO_ANSWER", "RETRYING", "FAILED"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === s ? "bg-green-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}
            >
              {s === "all" ? "Tous" : s}
            </button>
          ))}
        </div>

        {/* Calls table */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-gray-500 text-xs">
                  <th className="text-left px-4 py-3">Boutique</th>
                  <th className="text-left px-4 py-3">Client</th>
                  <th className="text-left px-4 py-3">Téléphone</th>
                  <th className="text-left px-4 py-3">Montant</th>
                  <th className="text-left px-4 py-3">Statut</th>
                  <th className="text-left px-4 py-3">Tentatives</th>
                  <th className="text-left px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {loading && calls.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-600">Chargement...</td></tr>
                ) : calls.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-600">Aucun appel enregistré</td></tr>
                ) : (
                  calls.map((c) => (
                    <tr key={c.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                      <td className="px-4 py-3 text-xs text-gray-400 font-mono">{c.shopifyShopDomain.replace(".myshopify.com", "")}</td>
                      <td className="px-4 py-3 text-gray-300">{c.customerName}</td>
                      <td className="px-4 py-3 text-gray-400 font-mono text-xs">{c.customerPhone}</td>
                      <td className="px-4 py-3 text-gray-300">{c.orderTotal.toLocaleString("fr-FR")} {c.currency}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full text-white ${STATUS_COLORS[c.status] || "bg-gray-700"}`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400">{c.attempts}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{new Date(c.createdAt).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value, color, isString }: { label: string; value: number | string; color: string; isString?: boolean }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{isString ? value : value.toLocaleString()}</p>
    </div>
  );
}
