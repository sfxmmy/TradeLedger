# Trading Journal Pro

A professional trading journal web application with Discord authentication, Stripe payments, and customizable trade tracking.

## Features

- 🔐 **Discord Authentication** - Free login with Discord
- 💳 **Stripe Subscriptions** - Monthly Pro subscription for $9/month
- 📊 **Custom Fields** - Create your own inputs (timeframes, sessions, setups, etc.)
- 📈 **Advanced Statistics** - PnL, winrate, RR broken down by any field
- 📸 **Trade Screenshots** - Attach images to every trade
- 💾 **Cloud Sync** - Data stored securely in Supabase
- 🎨 **Beautiful UI** - Dark theme with interactive charts

## Tech Stack

- **Frontend**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth + Discord OAuth
- **Payments**: Stripe
- **Styling**: Inline styles (no Tailwind CSS dependency)

---

## Setup Guide

### 1. Supabase Setup

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Go to **SQL Editor** and run the contents of `supabase-schema.sql`
3. Go to **Settings > API** and copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY`

### 2. Discord OAuth Setup

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Go to **OAuth2** tab
4. Add redirect URL: `https://YOUR_SUPABASE_URL/auth/v1/callback`
5. Copy the Client ID and Client Secret
6. In Supabase: Go to **Authentication > Providers > Discord**
7. Enable Discord and paste your Client ID and Client Secret

### 3. Stripe Setup

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Get your API keys from **Developers > API Keys**:
   - Publishable key → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - Secret key → `STRIPE_SECRET_KEY`
3. Create a product and price:
   - Go to **Products** and create "JournalPro Pro"
   - Add a recurring price of $9/month
   - Copy the Price ID → `STRIPE_PRICE_ID`
4. Set up webhook:
   - Go to **Developers > Webhooks**
   - Add endpoint: `https://your-domain.com/api/stripe/webhook`
   - Select events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
   - Copy Webhook Secret → `STRIPE_WEBHOOK_SECRET`

### 4. Environment Variables

Create a `.env.local` file:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...

# App URL (change for production)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and import your repository
3. Add all environment variables in the Vercel dashboard
4. Deploy!

After deployment:
- Update `NEXT_PUBLIC_APP_URL` to your Vercel domain
- Update Discord OAuth redirect URL
- Update Stripe webhook URL

### Other Platforms

Works with any Node.js hosting (Railway, Render, DigitalOcean, etc.)

---

## Free vs Pro Features

| Feature | Free | Pro ($9/mo) |
|---------|------|-------------|
| Trading Accounts | 1 | Unlimited |
| Trades | 50 | Unlimited |
| Custom Fields | 5 | Unlimited |
| Statistics | Basic | Advanced |
| Export Data | ❌ | ✅ |
| Priority Support | ❌ | ✅ |

---

## Project Structure

```
journal-pro/
├── app/
│   ├── page.js              # Landing page
│   ├── login/page.js        # Login page
│   ├── pricing/page.js      # Pricing page
│   ├── dashboard/page.js    # Main dashboard
│   ├── account/[id]/page.js # Journal & Statistics
│   └── api/
│       ├── auth/callback/route.js
│       └── stripe/
│           ├── create-checkout/route.js
│           ├── create-portal/route.js
│           └── webhook/route.js
├── components/
│   └── AuthProvider.js      # Auth context
├── lib/
│   ├── supabase.js          # Client-side Supabase
│   ├── supabase-server.js   # Server-side Supabase
│   └── stripe.js            # Stripe utilities
├── supabase-schema.sql      # Database schema
└── .env.example             # Environment template
```

---

## License

MIT License - feel free to use for your own projects!
