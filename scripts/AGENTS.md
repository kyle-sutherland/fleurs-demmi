# scripts/ — One-off Maintenance Scripts

Run with `npx tsx scripts/<name>.ts`. Not invoked by the app at runtime. Intended for manual, infrequent data seeding and migrations against Square.

## FILES

| Script | Purpose | Idempotent? |
|--------|---------|-------------|
| `seed-square-attributes.ts` | Creates custom attribute definitions (`name_fr`, `description_fr`, `variation_name_fr`, `bouquets`) on Square, then seeds FR localizations + bouquet counts onto catalog items pulled from `lib/translations/fr.ts`. | Yes — uses upsert; safe to re-run. |
| `upload-vase-images.ts` | Uploads `/public/Vases/*.jpg` to Square and attaches them to the corresponding catalog items. | Yes — name-based check skips existing uploads. |

## CONVENTIONS

- **Manual env loading.** tsx does NOT auto-load `.env.local`. Every script must include this block at the top:
  ```ts
  import * as fs from 'fs'
  const envLines = fs.readFileSync('.env.local', 'utf-8').split('\n')
  for (const line of envLines) {
    const [key, ...rest] = line.split('=')
    if (key && rest.length) process.env[key.trim()] = rest.join('=').trim()
  }
  ```
  Copy from `upload-vase-images.ts`. Do not use `dotenv` — it's not a dependency.
- **Hardcoded Square IDs** are OK in scripts — they're one-offs that target specific catalog objects. Cross-reference with `square-catalog.csv` at the repo root.
- **SquareClient construction** mirrors `app/lib/square.ts` (token + environment switch). Don't import from `@/app/lib/square` — keeps scripts decoupled.
- **Log loudly.** Scripts are run interactively; emit `console.log` for each step so operators can see progress.

## ANTI-PATTERNS

- ❌ Don't wire scripts into `package.json` scripts — they're intentionally invoked with `npx tsx` so they feel manual and deliberate.
- ❌ Don't run scripts against production without setting `SQUARE_ENVIRONMENT=production` in `.env.local`. Default is sandbox.
- ❌ Don't delete data from these scripts — current ones are append/upsert only. A destructive script should live behind a `--confirm` flag.
- ❌ Don't import anything from `app/*` — scripts are stand-alone by convention.

## WHEN TO ADD A SCRIPT HERE

- One-off catalog migrations, image uploads, bulk seeds.
- **Not** recurring jobs (no scheduler exists).
- **Not** tests (none configured).
