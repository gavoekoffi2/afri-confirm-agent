# AfriConfirm Agent 🤖📞

> Agent vocal IA pour la confirmation automatique des commandes e-commerce en Afrique (COD/Cash on Delivery)

## Le problème

En Afrique, l'e-commerce fonctionne principalement avec le **paiement à la livraison (COD)**. Quand un client commande, il ne paie pas immédiatement — il faut l'appeler pour confirmer sa commande avant livraison.

**Le problème :** les e-commerçants rappellent trop tard → le client n'est plus intéressé → perte de vente.

## La solution

**AfriConfirm Agent** appelle automatiquement le client **5 secondes après sa commande** (configurable), via un agent vocal IA parlant français (ou la langue locale), pour confirmer ou annuler la commande.

## Fonctionnement

```
Client commande sur Shopify
       ↓ (5 secondes)
Agent IA appelle le client
       ↓
"Bonjour [Prénom], je suis Aïssa, l'assistante de la boutique.
 Je vous appelle pour confirmer votre commande de 25 000 XOF.
 Souhaitez-vous confirmer ?"
       ↓
Client répond "oui" → Commande confirmée dans Shopify + tag "agent-confirmed"
Client répond "non" → Commande annulée dans Shopify automatiquement
Pas de réponse → Rappel automatique dans 30 min (max 3 tentatives)
```

## Architecture

```
Shopify Webhook (orders/create)
    ↓
Express.js API (validation HMAC)
    ↓
BullMQ Queue (Redis) — délai configurable
    ↓
Twilio Voice API (appel sortant)
    ↓
TwiML Webhooks (collecte réponse vocale)
    ↓
GPT-4o-mini (analyse intention si ambiguë)
    ↓
Shopify Admin API (mise à jour commande)
```

## Stack

| Composant | Technologie |
|-----------|-------------|
| Backend | Node.js + TypeScript + Express |
| Queue | BullMQ + Redis |
| Voice | Twilio Voice API |
| TTS | Twilio Polly (Lea - Français) |
| STT | Twilio Speech Recognition |
| AI | GPT-4o-mini (analyse intent) |
| DB | PostgreSQL + Prisma |
| Deploy | Docker + Docker Compose |

## Installation

### 1. Prérequis
- Compte Twilio avec un numéro de téléphone
- Shopify Partner account ou boutique existante
- Docker + Docker Compose

### 2. Configuration

```bash
cp .env.example .env
# Éditez .env avec vos credentials Twilio et OpenAI
```

### 3. Lancement

```bash
docker compose up -d
```

### 4. Enregistrement de votre boutique Shopify

```bash
curl -X POST https://votre-domaine.com/api/webhooks/register \
  -H "Authorization: Bearer votre-admin-secret" \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "votre-boutique.myshopify.com",
    "accessToken": "shpat_...",
    "webhookSecret": "votre-webhook-secret",
    "agentName": "Aïssa",
    "agentLanguage": "fr"
  }'
```

### 5. Configurer le webhook Shopify

Dans votre Shopify Admin → Settings → Notifications → Webhooks :
- Event: `Order creation`
- URL: `https://votre-domaine.com/api/webhooks/shopify`
- Format: JSON

## API

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/health` | GET | Santé du service |
| `/api/webhooks/shopify` | POST | Webhook Shopify |
| `/api/webhooks/register` | POST | Enregistrer une boutique |
| `/api/webhooks/stats` | GET | Statistiques (admin) |
| `/api/calls` | GET | Liste des appels (admin) |
| `/api/calls/twiml/:id` | POST | TwiML Twilio (interne) |
| `/api/calls/gather/:id` | POST | Collecte réponse (interne) |
| `/api/calls/status/:id` | POST | Statut appel (interne) |

## Marchés cibles

| Pays | Préfixe | Langue |
|------|---------|--------|
| Côte d'Ivoire | +225 | Français |
| Sénégal | +221 | Français |
| Cameroun | +237 | Français |
| Mali | +223 | Français |
| Burkina Faso | +226 | Français |
| Togo | +228 | Français |
| Bénin | +229 | Français |
| Nigeria | +234 | English |
| Ghana | +233 | English |

## Roadmap

- [x] Confirmation vocale automatique
- [x] Retry automatique (3 tentatives)
- [x] Intégration Shopify complète
- [x] Support multi-boutiques
- [ ] Dashboard admin web
- [ ] Support WhatsApp (alternative à l'appel)
- [ ] Voix ElevenLabs (accent africain authentique)
- [ ] Support Hausa, Wolof, Moore
- [ ] Analytics & reporting
- [ ] Intégration WooCommerce

## Pricing suggéré

| Plan | Prix/mois | Commandes/mois | Support |
|------|-----------|----------------|---------|
| Starter | 15 000 XOF | 200 | Email |
| Growth | 35 000 XOF | 600 | WhatsApp |
| Pro | 75 000 XOF | Illimité | Dédié |

---

**Fait avec ❤️ pour les e-commerçants africains**
