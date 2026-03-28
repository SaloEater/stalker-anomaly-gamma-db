# Vue Migration — Remaining Work

Status: Phase 1-3 complete. Vite build, 18 SFC components, code splitting, TypeScript ready.

## Incremental (do as you touch each area)

### Decompose app.js (~5,800 lines)
The monolithic `site/js/app.js` still holds all data, methods, computed properties, watchers, and lifecycle hooks. Migrate logic into components/composables as features are modified:

- **Composables**: Extract shared logic into `site/src/composables/` (e.g. `useFilters`, `useBuild`, `useSearch`, `useFavorites`, `useRecent`, `usePins`, `useI18n`, `useRouting`)
- **Move data/methods to owning components**: Build planner state + methods → `BuildPlanner.vue`, modal state → `ItemDetailModal.vue`, etc.
- **Remove globals.js bridge**: Once app.js consumers import Fuse/FloatingUI/Chart directly, delete `site/src/globals.js` and the `globalThis` assignments

### TypeScript
- New components: use `<script lang="ts">` or `<script setup lang="ts">`
- Existing components: migrate incrementally, starting with leaf components (FooterBar, StatBar) and working inward
- Type the provide/inject interface (currently untyped string keys)
- Run `npm run typecheck` in CI

### Composition API
- Convert components from Options API to `<script setup>` as they're modified
- Natural pairing with TypeScript migration — do both at once per component

### Scoped CSS
- Move component-specific styles from `site/css/style.css` into `<style scoped>` blocks
- Keep truly global styles (CSS variables, resets, typography, scrollbars) in style.css
- Do per-component when modifying that component's styles

### Additional code splitting
- Lazy-load `ItemDetailModal` (large template, only shown on item click)
- Lazy-load `SaveImportModal` (niche feature, heavy with file parsing)
- Lazy-load `ComparePanel` (includes Chart.js radar chart)

## Optional / Low Priority

### Vue Router
- Replace manual `pushUrlState`/`restoreUrlState` (~80 lines each) with vue-router
- Enables route guards, lazy route loading, cleaner URL state management
- Significant rewrite — only worthwhile if URL routing becomes a pain point

### Pinia
- Replace the `provide/inject` pattern + reactive store with Pinia if state management becomes unwieldy
- Current pattern works fine for the app's complexity

### Testing
- Add component tests (vitest + @vue/test-utils) once components have their own logic
- Currently components are pure template extractions — testing the framework, not business logic
- Prioritize testing composables once extracted from app.js
