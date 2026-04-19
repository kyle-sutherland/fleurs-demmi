# app/components/ — UI Components

Flat directory. Mix of Server Components (default) and Client Components (`'use client'` when needed for state/events/browser APIs).

## Server vs Client

| Component | Type | Why |
|-----------|------|-----|
| `SiteHeader`, `DaisyLogo`, `LangSwitcher` | Server | No interactivity; read locale via prop |
| `AddToCartButton`, `CartBadge`, `CartItemControls` | Client | useState + `fetch('/api/cart')` + `window.dispatchEvent('cart-updated')` |
| `CheckoutForm`, `FuneralsCheckoutForm`, `MothersDayCheckoutForm`, `WeddingsForm` | Client | Square Web Payments SDK + form state + Turnstile |
| `EmailSignupForm`, `BouquetSubscribeButton` | Client | Inline forms calling `/api/*` |
| `TurnstileWidget` | Client | Dynamically loads Cloudflare script, renders invisible widget |
| `MobileMenu` | Client | Toggle state |
| `BouquetSlideshow`, `WeddingSlideshow` | Client | Timer-driven slide advance |

## CONVENTIONS

- **All forms** include a visually-hidden honeypot: `<input name="website" style={{display:'none'}} tabIndex={-1} aria-hidden="true" />`.
- **Turnstile token** is collected via `<TurnstileWidget onToken={setToken} />` and sent as `turnstile` in the POST body. In dev (no site key), it resolves to `'dev'` immediately.
- **Square Web Payments SDK** is loaded dynamically in `CheckoutForm`/`FuneralsCheckoutForm`/`MothersDayCheckoutForm`:
  - Pass `applicationId`, `locationId`, `sdkUrl` as props from the Server Component page.
  - On submit: `card.tokenize()` → POST `{ token, ...formData }` to `/api/checkout/*` → redirect to `/order-confirmation?orderId=…`.
- **Cart mutations** dispatch `window.dispatchEvent(new Event('cart-updated'))` so `CartBadge` re-fetches. Also call `router.refresh()` to revalidate Server Component data.
- **Naming**: PascalCase filenames = component name. Default-export for most; named export for `{CartBadge, CartBadgeMobile}` and `TurnstileWidget`.
- **i18n**: components receive `t: Dictionary` or specific `t.section` slices as props — they don't call `getDictionary()` themselves. Exception: `SiteHeader` calls `getDictionary(locale)` since it's server-rendered.
- **Tailwind only** — no CSS modules, no styled-components. Project-custom classes: `font-display`, `font-sans`, `clip-bowtie`, `accent-purple` (defined in `app/globals.css`).

## ANTI-PATTERNS

- ❌ Don't import from `app/lib/*` in Client Components — those modules use server-only env vars and SDKs. Call the matching `/api/*` route instead.
- ❌ Don't hardcode Square `applicationId`/`locationId` — receive via props from the Server Component page (which reads `NEXT_PUBLIC_SQUARE_*` env vars).
- ❌ Don't drop the honeypot + Turnstile — the API route rejects submissions without them.
- ❌ Don't use `useRouter` from `next/router` — only `next/navigation` (App Router).
- ❌ Don't create a subdirectory for component organization unless the flat list hits >30 files. Current convention is flat.
