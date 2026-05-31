# E-Commerce SaaS Template

Reusable, configurable Next.js storefront template with order workflow operations, admin controls, and white-label deployment support.

## What This Template Provides

- White-label ready brand and theme configuration
- Configurable business behavior flags
- Order request intake and admin order workflow lifecycle
- Payment instruction workflow with environment-based handles
- Conversion and revenue tracking in admin orders workspace
- Client-handoff mode for simplified admin experience

## Core Configuration Files

- `src/lib/config/site-config.ts`: brand name, support contact, domain, currency, logos, theme colors
- `src/lib/config/business-config.ts`: order review/manual payments/follow-ups/client mode flags
- `src/lib/config/payment-profiles.ts`: payment instruction generation with env-backed handles

## Environment Setup

1. Copy the example file:

```bash
cp .env.example .env.local
```

2. Update required values:

- `ADMIN_PASSWORD`
- `ADMIN_AUTH_SECRET`
- `PAYMENT_HANDLES`
- `EMAIL_FROM`

3. Update branding values for each client deployment:

- `NEXT_PUBLIC_BRAND_NAME`
- `NEXT_PUBLIC_DOMAIN`
- `NEXT_PUBLIC_SUPPORT_*`
- `NEXT_PUBLIC_LOGO_*`
- `NEXT_PUBLIC_THEME_*`

## Run Locally

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Validate Build

```bash
npm run build
```

## Database (Optional)

For local demos, the app can render with static seed data when `DATABASE_URL` is omitted. For production, set `DATABASE_URL`; order persistence and catalog reads are treated as required.

If you want persistent storage locally, set `DATABASE_URL` and run:

```bash
npm run prisma:generate
npm run prisma:push
```

Without `DATABASE_URL` in local development, the app falls back to in-memory behavior for order records. Do not use that mode for production orders.

For production databases, apply committed migrations before or during deployment:

```bash
npm run prisma:deploy
```

## Storefront Modes

Set:

```bash
NEXT_PUBLIC_DISABLE_CATEGORIES="true"
```

The Peppers & Vibes storefront keeps categories disabled so `/shop` displays all active products on one page instead of category navigation.

## Client Handoff Mode

Set:

```bash
NEXT_PUBLIC_CLIENT_MODE="true"
```

When enabled:

- Developer/debug-oriented admin details are hidden
- Admin dashboard is simplified for client operation

## Deploying

The app can be deployed on any Next.js-compatible platform (Vercel, container, VM).

Minimum deployment steps:

1. Provision environment variables from `.env.example`
2. Set strong values for auth and payment/email fields
3. Configure `DATABASE_URL` if persistence is required
4. Run build command: `npm run build`
5. Start command: `npm run start`

## Productization Checklist

- Replace logos under `public/images/brand`
- Adjust theme via `NEXT_PUBLIC_THEME_*`
- Set client support contact details
- Configure payment handles per client
- Set `NEXT_PUBLIC_CLIENT_MODE` as needed
