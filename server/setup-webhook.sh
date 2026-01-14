#!/bin/bash

# Complete Webhook Setup Script
# Dit script doet alles automatisch zodra Stripe CLI geïnstalleerd is

SERVER_URL="${SERVER_URL:-http://localhost:5001}"

echo "🔧 Stripe Webhook Setup"
echo "======================"
echo ""

# Check if Stripe CLI is installed
if ! command -v stripe &> /dev/null; then
    echo "❌ Stripe CLI niet gevonden!"
    echo ""
    echo "Installeer Stripe CLI eerst:"
    echo ""
    echo "Optie 1: Met Homebrew (aanbevolen)"
    echo "  brew install stripe/stripe-cli/stripe"
    echo ""
    echo "Optie 2: Download van GitHub"
    echo "  https://github.com/stripe/stripe-cli/releases"
    echo "  Download: stripe_X.X.X_darwin_amd64.tar.gz"
    echo "  Extract en zet in PATH"
    echo ""
    echo "Na installatie, run dit script opnieuw."
    exit 1
fi

echo "✅ Stripe CLI gevonden: $(stripe --version)"
echo ""

# Check if logged in
if ! stripe config --list &> /dev/null; then
    echo "⚠️  Je bent nog niet ingelogd bij Stripe"
    echo ""
    echo "Run eerst:"
    echo "  stripe login"
    echo ""
    echo "Dit opent je browser om in te loggen."
    echo ""
    read -p "Druk Enter om door te gaan na login, of Ctrl+C om te stoppen..."
    echo ""
fi

# Check if server is running
if ! curl -s "$SERVER_URL/health" > /dev/null; then
    echo "❌ Server draait niet op $SERVER_URL"
    echo "Start de server eerst: npm run server"
    exit 1
fi

echo "✅ Server draait"
echo ""

# Stop any existing webhook forwarding
pkill -f "stripe listen" 2>/dev/null || true
sleep 1

# Start webhook forwarding
echo "🔄 Starting webhook forwarding..."
echo "   Forwarding to: $SERVER_URL/api/payments/webhook"
echo ""

stripe listen --forward-to "$SERVER_URL/api/payments/webhook" > /tmp/stripe_webhook.log 2>&1 &
STRIPE_PID=$!

sleep 3

# Extract webhook secret
WEBHOOK_SECRET=$(cat /tmp/stripe_webhook.log | grep -o "whsec_[a-zA-Z0-9]*" | head -1)

if [ -z "$WEBHOOK_SECRET" ]; then
    echo "❌ Kon webhook secret niet vinden"
    echo "Check logs: cat /tmp/stripe_webhook.log"
    kill $STRIPE_PID 2>/dev/null || true
    exit 1
fi

echo "✅ Webhook forwarding gestart (PID: $STRIPE_PID)"
echo "✅ Webhook secret: $WEBHOOK_SECRET"
echo ""

# Update .env file
ENV_FILE=".env"
if [ ! -f "$ENV_FILE" ]; then
    echo "⚠️  .env file niet gevonden, maak aan..."
    touch "$ENV_FILE"
fi

# Check if STRIPE_WEBHOOK_SECRET already exists
if grep -q "STRIPE_WEBHOOK_SECRET=" "$ENV_FILE"; then
    # Update existing
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s|STRIPE_WEBHOOK_SECRET=.*|STRIPE_WEBHOOK_SECRET=$WEBHOOK_SECRET|" "$ENV_FILE"
    else
        # Linux
        sed -i "s|STRIPE_WEBHOOK_SECRET=.*|STRIPE_WEBHOOK_SECRET=$WEBHOOK_SECRET|" "$ENV_FILE"
    fi
    echo "✅ .env updated (STRIPE_WEBHOOK_SECRET)"
else
    # Add new
    echo "" >> "$ENV_FILE"
    echo "STRIPE_WEBHOOK_SECRET=$WEBHOOK_SECRET" >> "$ENV_FILE"
    echo "✅ .env updated (STRIPE_WEBHOOK_SECRET toegevoegd)"
fi

echo ""
echo "📋 Volgende stappen:"
echo ""
echo "1. Herstart de server (Ctrl+C en dan: npm run server)"
echo ""
echo "2. Test webhook met:"
echo "   ./test-webhook-manual.sh"
echo ""
echo "   OF handmatig:"
echo "   - Maak capsule + payment intent"
echo "   - Ga naar Stripe Dashboard"
echo "   - Zoek payment intent"
echo "   - Klik 'Send test webhook' → 'payment_intent.succeeded'"
echo ""
echo "3. Check server logs voor:"
echo "   'Payment succeeded for capsule {public_id}'"
echo ""
echo "⚠️  Let op: Stripe webhook forwarding draait in de achtergrond"
echo "   Stop met: pkill -f 'stripe listen'"
echo ""
echo "✅ Setup compleet! Webhook secret is in .env gezet."
