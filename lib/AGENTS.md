# lib/ — i18n Dictionaries

**Not to be confused with `app/lib/`.** This directory holds translations only. Business logic lives in `app/lib/`.

## STRUCTURE

```
lib/
├── i18n.ts              # getDictionary(locale) → Dictionary; exports `Dictionary` type
└── translations/
    ├── en.ts            # Source of truth — exports `en` const + `Dictionary` type
    └── fr.ts            # Must match `en` shape exactly (typed as `Dictionary`)
```

## CONVENTIONS

- **`en.ts` is the schema.** Its `typeof en` is the `Dictionary` type. `fr.ts` imports `Dictionary` and satisfies it — if you add a key to `en.ts`, `fr.ts` MUST gain the same key or TypeScript errors.
- **Access pattern**: `const t = getDictionary(locale); t.home.shopNow`. Never `dictionaries[locale]` directly.
- **Unicode escapes** (`\u2019`, `\u00e9`, `\u00b7`) are used throughout — safer than literal curly quotes/accents in source. Preserve them.
- **Fallback**: `getDictionary()` returns `en` for any unknown locale (defensive — `proxy.ts` already restricts to `en`/`fr`).

## WHERE TO LOOK

| Task | File |
|------|------|
| Add a new translation key | Add to `en.ts` → TS will demand the same in `fr.ts` |
| Add a new locale | New file in `translations/`, register in `i18n.ts` `dictionaries` map, add to `LOCALES` in `/proxy.ts` |
| Find what `t.foo.bar` resolves to | `en.ts` (always the English literal) |

## ANTI-PATTERNS

- ❌ Don't put business logic or non-string data here — only string dictionaries.
- ❌ Don't duplicate the type definition in `fr.ts` — it imports `Dictionary` from `en.ts`.
- ❌ Don't call `getDictionary()` in Client Components — pass the relevant slice from a Server Component parent instead (keeps bundles small).
