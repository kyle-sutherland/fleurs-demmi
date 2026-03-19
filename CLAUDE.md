# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
pnpm dev        # Start dev server (Turbopack, outputs to .next/dev)
pnpm build      # Production build (Turbopack by default)
pnpm start      # Start production server
pnpm lint       # Run ESLint directly (next lint is removed in v16)
```

There are no tests configured yet.

## Stack

- **Next.js 16.2** with App Router (no Pages Router)
- **React 19.2** (canary, built into App Router)
- **TypeScript** (strict mode, `@/*` maps to project root)
- **Tailwind CSS v4** via `@tailwindcss/postcss`
- **Turbopack** is the default bundler for both dev and build

## Key Next.js 16 Breaking Changes

Before writing any code, read the relevant guide in `node_modules/next/dist/docs/`. Critical changes from v15→v16:

**Async-only Request APIs** — `cookies()`, `headers()`, `draftMode()`, `params`, and `searchParams` are now async-only. Always `await` them:
```tsx
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
}
```

**`middleware` → `proxy`** — The middleware file convention is deprecated. Use `proxy.ts` with `export function proxy(request: Request)`. Note: `proxy` runs Node.js runtime only (not edge).

**`next lint` removed** — Use `eslint` directly. `next build` no longer runs the linter.

**`next/legacy/image` deprecated** — Use `next/image` only.

**`images.domains` deprecated** — Use `images.remotePatterns` instead.

**`serverRuntimeConfig`/`publicRuntimeConfig` removed** — Use `process.env` directly in Server Components; prefix client-accessible vars with `NEXT_PUBLIC_`.

**PPR (`experimental_ppr`)** removed — Use `cacheComponents: true` in `next.config.ts` for cache component behavior.

**Parallel routes** — All `@slot` directories now require explicit `default.js` files or builds fail.

**`next dev` outputs to `.next/dev`** — `next build` uses `.next/` as before; the two can run concurrently.

## Architecture

This is a fresh App Router project (`app/` directory). All layouts and pages are Server Components by default. Add `'use client'` only for components needing interactivity, browser APIs, or hooks.

- `app/layout.tsx` — Root layout with Geist fonts and global CSS
- `app/page.tsx` — Home page (`/`)
- `app/globals.css` — Global styles (Tailwind base)
- `public/` — Static assets served at `/`
- `next.config.ts` — Next.js configuration (TypeScript)
- `eslint.config.mjs` — ESLint flat config (required for v16)

Import alias `@/*` resolves to the project root (e.g. `@/app/components/Foo`).
