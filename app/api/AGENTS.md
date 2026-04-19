# app/api/ — Route Handlers

All server POST/GET endpoints. Payment flows, cart mutations, inventory, form submissions.

## STRUCTURE

```
api/
├── cart/route.ts                      GET / POST / DELETE / PATCH — cart cookie CRUD
├── subscribe/route.ts                 POST — newsletter signup (Turnstile-gated)
├── inquire/weddings/route.ts          POST — wedding inquiry form (no payment, emails only)
├── checkout/route.ts                  POST — main shop checkout (cart → Square order+payment)
├── checkout/funerals/route.ts         POST — sympathy order (Sympathy category variation + optional card)
└── checkout/mothers-day/route.ts      POST — Mother's Day (Mother's Day category variation + optional delivery + card)
```

Inventory is fetched directly from Server Components via `getInventoryByVariationId()` in `app/lib/inventory.ts` — there is no `/api/inventory` route (it was removed once pages started calling the lib directly).

## CONVENTIONS (every checkout/form route)

1. **Zod-validate body first** — return 400 on parse failure with `{ error: 'Invalid request.' }`.
2. **Honeypot check** — reject if `body.website` is non-empty.
3. **Turnstile** — `verifyTurnstile(body.turnstile, ip)` where `ip` comes from `cf-connecting-ip` or `x-forwarded-for`. 403 on fail.
4. **Idempotency** — `randomUUID()` for every `orders.create` and `payments.create`.
5. **Square error handling** — wrap in `try { } catch (err) { if (err instanceof SquareError) return 402 else 500 }`.
6. **Customer row** — call `appendToCustomerList({ source: '<flow-name>', ... })` alongside emails.
7. **Emails fire-and-log** — wrap `sendMail(...)` in inner try/catch so email failure doesn't fail the order.
8. **Clear the cart cookie** on successful shop checkout (`/api/checkout`) — the branded checkouts don't touch the cart.

## WHERE TO LOOK

| Task | File |
|------|------|
| Change cart cookie name / TTL | `cart/route.ts` (`COOKIE_NAME`, `COOKIE_MAX_AGE`) |
| Adjust Square total-mismatch tolerance (currently 5¢) | `checkout/route.ts` |
| Add/change a funerals arrangement | Square Dashboard → `Sympathy` category. No code change. |
| Add/change a Mother's Day bouquet | Square Dashboard → `Mother's Day` category. No code change. |
| Change the category names read by checkout routes | `SYMPATHY_CATEGORY` in `checkout/funerals/route.ts`, `MD_CATEGORY` / `CARD_CATEGORY` in `checkout/mothers-day/route.ts` |
| Change delivery/card add-on prices | `DELIVERY_PRICE` / `CARD_PRICE` constants at top of each branded checkout route |
| Change Turnstile dev bypass | `app/lib/turnstile.ts` (NODE_ENV check) |

## ANTI-PATTERNS

- ❌ Don't skip Turnstile or the honeypot on new routes — both are required gates.
- ❌ Don't compute payment amount from client-supplied values — the main `/api/checkout` verifies Square's own total against cart total. Branded checkouts derive `total` from server-side catalog lookups (never from `body.price` or similar).
- ❌ Don't hardcode Square item or variation IDs in route handlers — look them up via `getCatalogItemsByCategory(<name>, 'en')` like Mother's Day and Funerals do.
- ❌ Don't let email failure 500 the request — users already paid; surface the order ID regardless.
- ❌ Don't forget to await `cookies()` — Next 16 made it async.
