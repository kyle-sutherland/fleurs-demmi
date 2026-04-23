<!-- BEGIN:nextjs-agent-rules -->
# PROJECT KNOWLEDGE BASE

Fleurs d'Emmi — Montréal florist e-commerce. **Next.js 16** + App Router + Square payments + Google Sheets logging + OAuth2 Gmail.

## CRITICAL: Next.js 16 (NOT 15)

`package.json` pins `next@16.2.0`, `react@19.2.4`. Before writing code, read `node_modules/next/dist/docs/`. Breaking changes from v15:

- **Async-only request APIs** — `cookies()`, `headers()`, `draftMode()`, `params`, `searchParams` all require `await`:
  ```tsx
  export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params
  }
  ```
- **`middleware.ts` is deprecated** — use `proxy.ts` with `export function proxy(request)`. Runs Node runtime only (not edge). See `proxy.ts`.
- **`next lint` removed** — `pnpm lint` runs `eslint` directly. `next build` no longer lints.
- **`next/legacy/image` deprecated** — use `next/image` only.
- **`images.domains` deprecated** — use `images.remotePatterns` (see `next.config.ts`).
- **`serverRuntimeConfig`/`publicRuntimeConfig` removed** — use `process.env` directly. Client-accessible vars must be `NEXT_PUBLIC_*`.
- **`experimental_ppr` removed** — use `cacheComponents: true` in config.
- **Parallel route slots** require explicit `default.js`.
- **Dev outputs to `.next/dev/`**, prod build to `.next/` — they can run concurrently.

Do not rely on pre-v16 habits.

---

## STRUCTURE

```
./
├── app/
│   ├── [locale]/        # All pages, routed by /en or /fr
│   ├── api/             # Route handlers (POST/GET). See app/api/AGENTS.md
│   ├── components/      # Client & server components. See app/components/AGENTS.md
│   ├── lib/             # Business logic (Square, cart, email). See app/lib/AGENTS.md
│   └── layout.tsx       # Root layout; reads x-locale from proxy
├── lib/                 # i18n only. See lib/AGENTS.md
├── scripts/             # One-off tsx scripts. See scripts/AGENTS.md
├── public/              # Static assets incl. /Flower Photos/ and /Vases/
├── proxy.ts             # Locale redirect + x-locale header (NOT middleware.ts)
├── next.config.ts       # Square CDN image hosts whitelisted
└── square-catalog.csv   # Reference export — IDs used in app/lib/square.ts
```

---

## WHERE TO LOOK

| Task | Location |
|------|----------|
| **Add a new product** | Square Dashboard. Add item + assign to one of: `Vases`, `Bouquet Subscriptions`, `Mother's Day`, `Sympathy`, `Card Add-On`. No code change needed. Wait up to 1hr (ISR `revalidate = 3600`) or redeploy to see it live. |
| Square catalog / inventory fetch | `app/lib/catalog.ts`, `app/lib/inventory.ts` |
| Existing shop pages (all category-driven) | `app/[locale]/shop/{vases,bouquet-subscription,mothers-day}/page.tsx`, `app/[locale]/services/funerals/page.tsx` |
| New checkout flow (wholly new type, e.g. different required fields) | `app/api/checkout/<name>/route.ts` + matching form in `app/components/` |
| Order confirmation emails | `app/lib/email.ts` (nodemailer+OAuth2) |
| Customer row → Google Sheets | `app/lib/sheets.ts` |
| Locale routing logic | `proxy.ts` |
| Translations | `lib/translations/{en,fr}.ts` (keys must match `Dictionary` from en.ts) |
| Bot protection | `app/lib/turnstile.ts` + `app/components/TurnstileWidget.tsx` |
| Form validation | `app/lib/validate.ts` (zod schemas + `escapeHtml` for email bodies) |
| New image host | `next.config.ts` → `images.remotePatterns` |
| Add page | `app/[locale]/<route>/page.tsx` — always `async`, `params: Promise<{ locale: string }>` |

---

## CONVENTIONS (project-specific)

- **`@/*` path alias** → project root. Prefer `@/app/lib/foo` over `../../`.
- **Business logic lives in `app/lib/`** — components call it via `fetch('/api/…')` or import directly in Server Components.
- **Locale is read from `x-locale` header** (set by `proxy.ts`) in `app/layout.tsx`, OR from `params.locale` in pages. Never from `window.location`.
- **Money is in CAD cents as `BigInt`** when talking to Square (`BigInt(Math.round(dollars * 100))`). Displayed as dollars with `.toFixed(2)`.
- **Shop products flow from Square → site, zero-code** — pages use `getCatalogItemsByCategory(<name>, locale)` to fetch items live. Each flow is tied to a single Square category name (see WHERE TO LOOK). Adding/removing items in Square appears on site after ISR revalidation.
- **Cart stores raw Square variation IDs** in `productId`. Custom line items (e.g. delivery surcharges) use a non-Square-shaped ID like `delivery-surcharge:*`. The checkout route detects the shape via `/^[A-Z0-9]{20,30}$/`.
- **Branded checkouts (Mother's Day, Funerals) validate the submitted `variationId`** against a category lookup before charging — don't trust client-supplied variation IDs blindly.
- **Square order total is verified** before charging on the main shop checkout — see `app/api/checkout/route.ts` (tolerance: 5 cents). Follow this pattern for any new checkout that mixes catalog + custom line items.
- **Idempotency keys** use `randomUUID()` from `crypto` for every `orders.create` and `payments.create`.
- **HTML emails hand-escape every interpolation** with `escapeHtml()` from `@/app/lib/validate`. No template engine.
- **Form bodies always include a honeypot** (`website` field, must be empty) + Turnstile token. Server validates both.
- **Rate limiting** on all public POST endpoints via `enforceRateLimit(request, key)` from `@/app/lib/rateLimit`. Call it first in each POST handler, before Turnstile. Uses Upstash Redis sliding window (silently skipped in dev if Upstash env vars are unset). Keys: `checkout` (10/min), `inquire` (5/min), `subscribe` (3/min), `cart_write` (60/min).
- **IP extraction** — the site runs on Vercel (not Cloudflare). Use `x-forwarded-for` only: `request.headers.get('x-forwarded-for')?.split(',')[0].trim()`. Do NOT read `cf-connecting-ip`.
- **`'use client'` only when needed** — all pages/layouts are Server Components by default. Client components: cart badge, forms, slideshows, TurnstileWidget.

---

## ANTI-PATTERNS (this project)

- ❌ Don't introduce `middleware.ts` — locale logic lives in `proxy.ts`.
- ❌ Don't access `params` or `cookies()` without `await` — Next 16 made them async.
- ❌ Don't add a new image host via code — put it in `next.config.ts`.
- ❌ Don't use `next/legacy/image` or `images.domains` — removed in v16.
- ❌ Don't hardcode Square variation/item IDs in code — derive them from `getCatalogItemsByCategory()`. The only IDs that belong in code are Square category **names** (strings like `"Vases"`, `"Mother's Day"`).
- ❌ Don't reintroduce a productId-to-variationId lookup table — the old `PRODUCT_VARIATION_MAP` was removed. Cart productIds ARE Square variation IDs.
- ❌ Don't interpolate user input into HTML email bodies without `escapeHtml()`.
- ❌ Don't use `NEXT_PUBLIC_` prefix for server-only secrets (Square access token, OAuth refresh token).
- ❌ Don't skip Turnstile on new form endpoints — pattern is `verifyTurnstile(body.turnstile, ip)`.
- ❌ Don't call `next lint` — it's removed. Run `pnpm lint` which invokes `eslint` directly.

---

## COMMANDS

```bash
pnpm dev          # Dev server (Turbopack, outputs to .next/dev/)
pnpm build        # Prod build (Turbopack default)
pnpm start        # Prod server
pnpm lint         # ESLint flat config (no `next lint`)

# One-off maintenance
npx tsx scripts/seed-square-attributes.ts   # Seeds FR localization + `bouquets` attribute on Square catalog
npx tsx scripts/upload-vase-images.ts       # Uploads /public/Vases/* to Square items
```

---

## ENVIRONMENT

All env vars in `.env.local` (gitignored via `.env*`). Required:

- `SQUARE_ACCESS_TOKEN`, `SQUARE_ENVIRONMENT` (sandbox|production), `NEXT_PUBLIC_SQUARE_APPLICATION_ID`, `NEXT_PUBLIC_SQUARE_LOCATION_ID`
- `CLIENT_ID`, `CLIENT_SECRET`, `REFRESH_TOKEN` — Google OAuth2 (shared by nodemailer + Sheets API)
- `WEBMASTER_EMAIL`, `RECIPIENT_EMAIL`, `SUBSCRIBERS_SHEET_ID`
- `TURNSTILE_SECRET_KEY`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY` — Cloudflare Turnstile
- `CART_COOKIE_SECRET` — HMAC-SHA256 secret for signing the cart cookie (generate: `openssl rand -base64 32`). Required in production; falls back to an insecure placeholder in dev.
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` — Upstash Redis for distributed rate limiting (required in production; rate limiting is silently skipped in dev if unset). Create a free database at console.upstash.com.
- `NODE_OPTIONS=--dns-result-order=ipv4first` is set locally (IPv6 issues with some providers)

Scripts load `.env.local` **manually** via `fs.readFileSync` — tsx doesn't auto-load. Copy that pattern for new scripts.

---

## STYLING

- **Tailwind v4** via `@tailwindcss/postcss`. Global CSS in `app/globals.css`.
- Custom font: `Courier_Prime` from `next/font/google`, exposed as `--font-sans` on `<html>`.
- `font-display` and `font-sans` are project-custom classes in `globals.css`.

---

## KNOWN QUIRKS & GOTCHAS

- **No CI, no tests** — validate via `pnpm lint` + manual click-through.
- **`proxy.ts` runs Node runtime only** (Next 16 constraint). Don't use edge-only APIs there.
- **Production launch requires creating the catalog in production Square.** Code uses **category names** only, not IDs — so switching `SQUARE_ENVIRONMENT=production` just works once the production account has categories named `Vases`, `Bouquet Subscriptions`, `Mother's Day`, `Sympathy`, and `Card Add-On`. The `scripts/*.ts` one-offs still contain sandbox item IDs and must be updated before running against production.
- **Cart state is a signed cookie** (`cart` cookie, httpOnly, sameSite=lax, 30d). No DB. See `app/lib/cart.ts` + `app/api/cart/route.ts`.
- **Email failures are swallowed** on checkout routes (wrapped in try/catch that only logs) — order success is NOT blocked by email failure. Intentional.
- **`CLAUDE.md` mirrors much of this file** via `@AGENTS.md` — keep both lean.
<!-- END:nextjs-agent-rules -->
