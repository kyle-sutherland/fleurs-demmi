# CLAUDE.md

Guidance for Claude Code when working with code in this repository. Fleurs d'Emmi — Montréal florist
e-commerce. The authoritative, project-wide knowledge base lives in `AGENTS.md` (loaded below);
**keep this file lean and defer to `AGENTS.md`** rather than duplicating it.

@AGENTS.md

## Commands

```bash
pnpm dev        # Start dev server (Turbopack, outputs to .next/dev)
pnpm build      # Production build (Turbopack by default)
pnpm start      # Start production server
pnpm lint       # Run ESLint directly (next lint is removed in v16)
```

No unit test suite is configured; a Playwright smoke-test scaffold exists under `tests/`
(`pnpm exec playwright test`). Validate changes via `pnpm lint` + `pnpm build` + manual click-through.

## Stack

- **Next.js 16.2** App Router only, **React 19.2**, **TypeScript** (strict, `@/*` → project root)
- **Tailwind CSS v4** via `@tailwindcss/postcss`, **Turbopack** for dev/build
- **Square** payments + catalog, **Gmail OAuth2** (nodemailer + Google Sheets API), Couriers_Prime font

## How this repo differs from a stock Next.js 16 scaffold

- Every page lives under `app/[locale]/` (routes `/en` and `/fr`); locale is resolved in `proxy.ts`
  (NOT `middleware.ts`, deprecated in v16). See `AGENTS.md` "CRITICAL: Next.js 16".
- Server Components by default; business logic sits in `app/lib/` (Square, cart, email, sheets,
  validate, turnstile, rate limit). Client components only handle state/forms/widgets.
- Products flow from Square → site by **category name** — no hardcoded item/variation IDs in code.
  Money is **BigInt cents**. See `AGENTS.md` CONVENTIONS and ANTI-PATTERNS.

## First read before touching Next 16 internals

Read the relevant guide in `node_modules/next/dist/docs/` before writing code (async-only
`params`/`cookies`/`headers`, `proxy` over `middleware`, `images.remotePatterns`, PPR → `cacheComponents`).
`AGENTS.md` summarizes the v15→v16 breaking changes that apply here.
