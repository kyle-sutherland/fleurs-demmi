# app/lib/ — Business Logic

Pure TS modules called by route handlers, Server Components, and scripts. No JSX, no React. Each file is focused on one integration or concern.

## WHERE TO LOOK

| File | Purpose | Key exports |
|------|---------|-------------|
| `square.ts` | Square SDK client factory | `getSquareClient()`, `LOCATION_ID` |
| `catalog.ts` | Fetch localized catalog items/variations from Square | `getCatalogItemsByCategory()`, `getCatalogItem()`, types `CatalogProduct`/`CatalogVariation` |
| `inventory.ts` | Batch inventory counts by variation ID | `getInventoryByVariationId()` — returns `Record<variationId, count \| null>` (null = untracked, 0 = sold out) |
| `cart.ts` | Cart cookie parse/serialize + totals | `parseCart()`, `serializeCart()`, `cartTotal()`, `cartCount()`, types `Cart`/`CartItem` |
| `email.ts` | Send HTML email via Gmail OAuth2 | `sendMail({ to, subject, html })` |
| `sheets.ts` | Append customer row to Google Sheet | `appendToCustomerList({ name, email, source, subscribed, ... })` |
| `validate.ts` | Zod schemas + HTML escaping | `escapeHtml()`, `emailSchema`, `nameSchema`, `phoneSchema`, `textSchema`, `dateSchema` |
| `turnstile.ts` | Verify Cloudflare Turnstile token | `verifyTurnstile(token, ip?)` — returns `true` in dev when `TURNSTILE_SECRET_KEY` unset |

## CONVENTIONS

- **Server-only.** Never import these from Client Components (`'use client'`). They use env vars and server SDKs.
- **Money is `BigInt` cents** when talking to Square (`priceMoney: { amount: BigInt(x * 100), currency: 'CAD' }`). Read back via `Number(variation.priceMoney) / 100`.
- **Localization flows through `catalog.ts`**, not route handlers. Pass `locale` in; it pulls `name_fr` / `description_fr` / `variation_name_fr` from Square custom attributes, falling back to default name.
- **Catalog is category-keyed.** Pages fetch products via `getCatalogItemsByCategory(<category-name>, locale)`. Category names (`"Vases"`, `"Mother's Day"`, `"Sympathy"`, `"Bouquet Subscriptions"`, `"Card Add-On"`) are the only Square strings that belong in code.
- **`sheets.ts` + `email.ts` share `CLIENT_ID`/`CLIENT_SECRET`/`REFRESH_TOKEN`** — one OAuth2 setup powers both.

## ANTI-PATTERNS

- ❌ Don't add business logic in `app/components/` — put it here and export a function.
- ❌ Don't call Square directly from Client Components — always go through `/api/*` routes.
- ❌ Don't construct HTML email strings with user input without `escapeHtml()` (validate.ts).
- ❌ Don't hardcode Square variation or item IDs — fetch them via `getCatalogItemsByCategory()`.
- ❌ Don't reintroduce a `PRODUCT_VARIATION_MAP`-style lookup table. Adding products is a pure Square Dashboard operation.
- ❌ Don't treat `priceMoney` as `number` — it's `BigInt` in the Square SDK.
