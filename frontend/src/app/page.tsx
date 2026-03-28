import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Nav */}
      <nav className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-green-500 flex items-center justify-center font-bold text-sm">AC</div>
            <span className="font-bold text-lg">AfriConfirm</span>
          </div>
          <div className="flex gap-3">
            <Link href="/dashboard" className="bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors">
              Tableau de bord
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 pt-20 pb-16 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/30 text-green-400 text-sm px-4 py-1.5 rounded-full mb-6">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            Solution COD pour l&apos;e-commerce africain
          </div>
          <h1 className="text-5xl font-bold mb-6 leading-tight">
            Confirmez vos commandes{" "}
            <span className="text-green-400">automatiquement</span>{" "}
            en 5 secondes
          </h1>
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            AfriConfirm appelle vos clients dès qu&apos;ils commandent sur votre boutique Shopify.
            Votre agent vocal IA confirme ou annule la commande — sans intervention humaine.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/dashboard" className="bg-green-500 hover:bg-green-600 text-white px-8 py-3.5 rounded-xl font-semibold text-lg transition-colors">
              Voir la démo →
            </Link>
            <a href="#how" className="border border-gray-700 hover:border-gray-500 text-gray-300 px-8 py-3.5 rounded-xl font-medium text-lg transition-colors">
              Comment ça marche
            </a>
          </div>
        </div>
      </section>

      {/* Problem/Solution */}
      <section className="px-6 py-16 bg-gray-900/50">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
          <div className="bg-red-900/20 border border-red-800/50 rounded-2xl p-6">
            <div className="text-2xl mb-3">😤</div>
            <h3 className="font-bold text-lg mb-3 text-red-400">Le problème actuel</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>❌ Le client commande mais ne paie pas immédiatement</li>
              <li>❌ Votre équipe rappelle 1-2h après</li>
              <li>❌ Le client a changé d&apos;avis, a commandé chez un concurrent</li>
              <li>❌ 30-40% des commandes COD ne sont jamais livrées</li>
              <li>❌ Coût logistique des retours</li>
            </ul>
          </div>
          <div className="bg-green-900/20 border border-green-800/50 rounded-2xl p-6">
            <div className="text-2xl mb-3">🤖</div>
            <h3 className="font-bold text-lg mb-3 text-green-400">Avec AfriConfirm</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>✅ Appel automatique en 5 secondes</li>
              <li>✅ Agent IA parle parfaitement français</li>
              <li>✅ Confirmation ou annulation en temps réel</li>
              <li>✅ Retry automatique si pas de réponse</li>
              <li>✅ Taux de confirmation &gt;75%</li>
            </ul>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Fonctionnement en 4 étapes</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: "01", icon: "🛒", title: "Commande Shopify", desc: "Votre client remplit le formulaire de commande" },
              { step: "02", icon: "📞", title: "Appel automatique", desc: "AfriConfirm appelle le client en 5 secondes" },
              { step: "03", icon: "🎙️", title: "Conversation IA", desc: "\"Bonjour [Prénom], votre commande de 25 000 XOF...\"" },
              { step: "04", icon: "✅", title: "Shopify mis à jour", desc: "Commande confirmée ou annulée automatiquement" },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="text-4xl font-black text-green-500/20 mb-2">{s.step}</div>
                <div className="text-3xl mb-2">{s.icon}</div>
                <h4 className="font-semibold mb-1">{s.title}</h4>
                <p className="text-xs text-gray-400">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="px-6 py-20 bg-gray-900/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Tarifs simples et transparents</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: "Starter", price: "15 000", currency: "XOF/mois", calls: "200 appels/mois", features: ["Voix IA française", "Retry automatique", "Dashboard basique", "Support email"] },
              { name: "Growth", price: "35 000", currency: "XOF/mois", calls: "600 appels/mois", featured: true, features: ["Tout Starter +", "Voix premium (accent local)", "Analytics avancé", "Support WhatsApp"] },
              { name: "Pro", price: "75 000", currency: "XOF/mois", calls: "Illimité", features: ["Tout Growth +", "Multi-boutiques", "API complète", "Support dédié 24/7"] },
            ].map((p) => (
              <div key={p.name} className={`rounded-2xl p-6 border ${p.featured ? "bg-green-500/10 border-green-500" : "bg-gray-800 border-gray-700"}`}>
                {p.featured && <div className="text-xs text-green-400 font-medium mb-2">POPULAIRE</div>}
                <h3 className="font-bold text-xl mb-1">{p.name}</h3>
                <div className="text-3xl font-black mb-1">{p.price} <span className="text-sm font-normal text-gray-400">{p.currency}</span></div>
                <div className="text-sm text-green-400 mb-4">{p.calls}</div>
                <ul className="space-y-2">
                  {p.features.map((f) => <li key={f} className="text-sm text-gray-300 flex gap-2"><span className="text-green-400">✓</span>{f}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Countries */}
      <section className="px-6 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-8">Disponible dans 9 pays africains</h2>
          <div className="flex flex-wrap gap-3 justify-center">
            {["🇨🇮 Côte d'Ivoire", "🇸🇳 Sénégal", "🇨🇲 Cameroun", "🇲🇱 Mali", "🇧🇫 Burkina Faso", "🇹🇬 Togo", "🇧🇯 Bénin", "🇳🇬 Nigeria", "🇬🇭 Ghana"].map((c) => (
              <span key={c} className="bg-gray-800 border border-gray-700 px-4 py-2 rounded-full text-sm">{c}</span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20">
        <div className="max-w-2xl mx-auto text-center bg-gradient-to-br from-green-500/10 to-gray-900 border border-green-500/20 rounded-2xl p-12">
          <h2 className="text-3xl font-bold mb-4">Prêt à augmenter votre taux de confirmation ?</h2>
          <p className="text-gray-400 mb-8">Contactez-nous pour une démo gratuite avec votre boutique Shopify.</p>
          <a href="mailto:contact@finablasolution.cloud" className="inline-block bg-green-500 hover:bg-green-600 text-white font-semibold px-10 py-4 rounded-xl text-lg transition-colors">
            Demander une démo gratuite
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 px-6 py-6 text-center text-gray-500 text-sm">
        © 2026 AfriConfirm — by Finab Solution. Tous droits réservés.
      </footer>
    </div>
  );
}
