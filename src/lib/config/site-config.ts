const pick = (inlined: string | undefined, fallback: string) =>
  inlined && inlined.trim().length > 0 ? inlined : fallback;

// Contact fields are intentionally hardcoded to prevent accidental env-var override.
// Update these values here or manage them via Admin → Settings (DB-driven when DATABASE_URL is set).
export const siteConfig = {
  brandName:       pick(process.env.NEXT_PUBLIC_BRAND_NAME, 'Peppers & Vibes'),
  supportEmail:    'support@peppersandvibes.com',
  infoEmail:       'info@peppersandvibes.com',
  domain:          pick(process.env.NEXT_PUBLIC_DOMAIN,     'example.com'),
  currency:        pick(process.env.NEXT_PUBLIC_CURRENCY,   'USD'),
  supportAddress:  '8092 S Yale #1057, Tulsa, OK 74136, United States',
  logos: {
    primary:   pick(process.env.NEXT_PUBLIC_LOGO_PRIMARY, '/images/brand/logo-primary.png'),
    alternate: pick(process.env.NEXT_PUBLIC_LOGO_ALT,     '/images/brand/logo-alt.png'),
  },
  theme: {
    bg:     pick(process.env.NEXT_PUBLIC_THEME_BG,      '#f8f7f5'),
    bgSoft: pick(process.env.NEXT_PUBLIC_THEME_BG_SOFT, '#f1eee8'),
    text:   pick(process.env.NEXT_PUBLIC_THEME_TEXT,    '#111111'),
    muted:  pick(process.env.NEXT_PUBLIC_THEME_MUTED,   '#6b7280'),
    accent: pick(process.env.NEXT_PUBLIC_THEME_ACCENT,  '#d4af37'),
  },
} as const;
