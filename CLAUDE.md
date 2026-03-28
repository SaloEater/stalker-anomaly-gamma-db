# Project: gamma-tools

## Git conventions
- Never use compound git commands (e.g. `cd X && git status`). Always run git commands directly from the repo root without chaining.

## Tech stack
- Vite build tool with Vue 3 Single File Components (Options API)
- `npm run dev` — Vite dev server with HMR
- `npm run build` — production build to `dist/`
- `npm run preview` — preview production build locally
- `npm run release` — build + copy Cloudflare Functions to dist
- Deploy: Cloudflare Pages via `npm run deploy`

## Project structure
- `site/` — Vite root
- `site/src/main.js` — entry point (creates app, registers directives + icons)
- `site/src/App.vue` — root component (layout shell, state, provide)
- `site/src/components/` — Vue SFC components
- `site/src/icons.js` — lucide-vue-next icon registry (tree-shaken)
- `site/src/globals.js` — temporary bridge for CDN-to-npm globals (Fuse, FloatingUI, Chart)
- `site/js/app.js` — legacy monolith (data, methods, computed, watchers, lifecycle) — being incrementally decomposed
- `site/css/style.css` — global styles (loaded via `<link>` in index.html)
- `site/public/` — static assets copied to dist as-is (data JSON, images, sub-pages)
- `functions/` — Cloudflare Pages Functions (API)
- `scripts/` — data generation, release, deploy scripts

## Components
- Child components receive data via **props** and communicate back via **emits**
- Shared helper methods (t, formatValue, headerLabel, etc.) are provided via Vue's **provide/inject**
- New provide entries go in `App.vue`'s `provide()` block
- Icons use `lucide-vue-next` components registered globally — add new icons to `site/src/icons.js`
- Do NOT use `data-lucide` attributes or `lucide.createIcons()` — use `<LucideIconName :size="N" />` instead

## Data pipeline
- CSV source files live in `data/<pack>`
- Run `node scripts/generate-index.mjs --pack <pack-id>` to generate JSON output in `site/public/data/<pack>/`
- When a new or updated CSV is added, review it against its docs in `data/docs/` then run the script
- Source translation CSVs are Windows-1251 encoded; the generation script decodes them automatically

## Translations
- `site/public/data/<pack>/translations.json` is **generated output** — never edit it directly
- App UI strings (anything not from game CSVs) go in `data/app_translations.json` (en + ru)
- Supplementary item name overrides go in `data/supplementary_translations.json`
- New UI text must be added to `data/app_translations.json` with both `en` and `ru` keys, then regenerate

## Build codes
- `data/<pack>/dictionary.json` maps item IDs to stable integers for Sqids build codes — append-only, never regenerate from scratch
- The generation script auto-appends new items; existing indices must never change
