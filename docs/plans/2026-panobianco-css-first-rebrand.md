# Panobianco Dashboard 2026 CSS-First Rebrand Implementation Plan

> **For Hermes:** Use `subagent-driven-development` to execute this plan task-by-task. Do not change KPI data contracts, Supabase schema, metric calculations, or URL/query-state behavior as part of the visual rebrand.

**Goal:** Rebrand the Next.js KPI dashboard as a calm, editorial Panobianco data product using a small CSS-first system of symbol-derived 45-degree chamfer modules, while keeping dense KPI grids, editable tables, and charts highly legible.

**Architecture:** Retain the existing React, Tailwind v4, shadcn/Base UI, CSS Modules, and Chart.js structure. Establish the official brand palette and semantic UI roles once in `app/globals.css`, add a KPI-scoped primitive stylesheet for the few reusable graphic modules, and migrate each current CSS Module/Tailwind literal to consume those roles. The proprietary module is a 45-degree chamfer derived from the brand symbol, implemented with CSS `clip-path` and pseudo-elements. It is not a generic octagon, a decorative repeating background, or a new SVG/logo substitute.

**Tech stack:** Next.js 16.2.1, React 19.2.4, TypeScript 5, Tailwind CSS 4, shadcn/Base UI, CSS Modules, Chart.js/react-chartjs-2, Supabase.

**Official source:** `/Users/guilhermeluchesi/Desktop/Branding_Guide_Panobianco_-_2026.pdf` (2026 Manual de marca). It overrides provisional/legacy tokens.

---

## Baseline and constraints

### Repository facts to preserve

- The app is a single KPI dashboard with dashboard (`app/kpis/page.tsx`), data entry (`app/kpis/entrada-dados/*`), configuration (`app/kpis/configuracoes/*`), and login (`app/login/page.tsx`) flows.
- The visual shell currently spans `app/globals.css`, `app/kpis/layout.tsx`, `app/kpis/layout.module.css`, `app/kpis/Navbar.tsx`, and `app/kpis/page.module.css`.
- `app/kpis/page.tsx` renders the section sequence and must preserve its data loading, period selection, insights, and chart behavior. Do not turn presentation color changes into changes to `getKpiPageData`, URL parameters, or APIs.
- The repo has no committed `*.test.*`/`*.spec.*` suite and `package.json` supplies `npm run lint` and `npm run build` only. Add no testing framework/dependency for this refactor. Use the existing lint/build gates plus browser/keyboard QA.
- Working-tree changes already exist in `app/globals.css`, `app/kpis/Navbar.tsx`, `app/kpis/_components/DashboardHeader.tsx`, `app/kpis/layout.module.css`, `app/kpis/layout.tsx`, and `app/kpis/page.module.css`. Treat them as another in-progress change: inspect/diff and reconcile intentionally; do not overwrite or discard them.
- `public/` currently contains only Next/Vercel sample SVGs, not approved Panobianco signature/icon/font files. Do not fabricate the signature, logo, or proprietary icon assets with text/CSS.

### Brand facts that drive the implementation

- Only these source colors may become brand tokens: `#FF6100` Panobianco orange, `#CC3300` warm orange, `#330000` grená, `#F4EDE4` off-white, `#87756B` concrete, `#3D3336` graphite, `#161515` black, and `#FFFFFF` white. Replace current near-misses such as `#FAEDE4`, `#F5DFD2`, old blues/purples/greens, and arbitrary warm browns where they are being used as brand styling.
- The visual language derives from the brand symbol: 45-degree cuts, usable as containers, masks, frames, bars, boxes, and indicators. The manual permits composition/repetition but says not to rotate it, not to add outlines, not to make a different form, and not to repeat the module more than three times in a graphic composition.
- Forma DJR Micro (Regular, Medium, Bold) is the official family. `app/kpis/layout.tsx` currently loads Archivo through `next/font/google` as an explicitly documented operational fallback. Keep that explicit fallback until licensed Forma webfont files and license/hosting approval are supplied; a CSS font-family declaration alone is not an asset integration.
- The manual requires approved solid geometric icons built from the same 45-degree logic. Keep Lucide only for familiar functional actions while acquiring/mapping approved interface icon SVGs; do not use outlined/gradient/shadowed invented “brand” icons as visual decoration.
- The exact institutional signature is `Panobianco. Feitos de força e vontade.` when a textual contextual signature is appropriate. For a logo/signature lockup, use an approved supplied asset and its approved positive/negative version, never CSS text that imitates the logo.

## Target visual system

### 1. Token layers and semantic meaning

Define brand primitives and role tokens in `app/globals.css`; expose the roles to Tailwind via the existing `@theme inline` mapping. Keep the current shadcn variables, but map them to semantic Panobianco roles rather than scattering hex values in component JSX.

| Role | Intended token | Use | Do not use for |
| --- | --- | --- | --- |
| `--pb-orange` | `#FF6100` | primary action, active navigation, focused control indicator, single key series, small brand edge | full-page background, all KPI cards, every table cell |
| `--pb-orange-warm` | `#CC3300` | restrained hover/pressed depth or a secondary data series | semantic error/success meaning |
| `--pb-burgundy` | `#330000` | navigation/header frame, editorial emphasis, chart comparison series | body text on off-white unless contrast is verified |
| `--pb-off-white` | `#F4EDE4` | page canvas and restrained grouped-table surfaces | white text/background substitute |
| `--pb-concrete` | `#87756B` | secondary metadata, disabled/non-actionable labels, quiet grid lines after contrast check | primary metric values, status-only communication |
| `--pb-graphite` | `#3D3336` | secondary text, borders, neutral comparison series | sole focus indicator |
| `--pb-black` | `#161515` | primary text, dark frame, foreground on large orange fill | large default page surface |
| `--pb-white` | `#FFFFFF` | cards, input canvas, inverse text only when contrast passes | an extra brand color |
| `--surface-*`, `--text-*`, `--border-*`, `--action-*`, `--feedback-*`, `--chart-*` | aliases of the above | components and Chart.js adapters | direct raw color usage outside token definition |

Feedback is not a new brand palette. Define documented semantic aliases using the approved colors plus redundant language/iconography: for example positive uses a clear “acima da meta” label and upward symbol with orange/black treatment, negative uses a “abaixo da meta” label and burgundy/black treatment, and neutral uses graphite. Never rely on hue alone, especially after removing the existing green/red/blue/purple metric scheme.

### 2. CSS-first proprietary primitives

Create `app/kpis/kpi-brand.module.css` with only composable structural classes and CSS custom properties. Use meaningful names, not `octagon`, such as:

- `.brandFrame`: an editorial frame/container with one 45-degree chamfer at a declared corner and a neutral surface. Used once per page header or feature panel.
- `.brandEdge`: a narrow, noninteractive orange leading edge/active indicator. Used for active navigation and information hierarchy, not every card.
- `.brandControl`: a focusable control surface with a single 45-degree chamfer for primary actions, selected tabs, or the month selector. It must retain native/button semantics and visible `:focus-visible` outline.
- `.brandMarker`: a compact noninteractive status/section marker. It must have an accessible text equivalent outside the marker.
- `.brandSurface`: a calm white/off-white content container without a heavy shadow, optionally with one chamfer only at meaningful editorial surfaces.

Implement a single CSS custom property such as `--pb-chamfer: 0.75rem` and use fixed 45-degree polygon coordinates. The implementation must include a no-`clip-path` fallback that remains rectangular and readable. Prefer CSS backgrounds/pseudo-elements over images or a new dependency. Do not use `filter: drop-shadow`, gradients inside isolated icons, ornamental outlines, rotations, or more than three repeated modules in one composition.

### 3. Placement policy for dense data UI

**Appropriate placements:**

1. One page-level header frame/edge around `DashboardHeader` and `MonthSelector` on `/kpis`.
2. The active nav item and a compact primary save action.
3. One concise section heading marker or thin orange rule for each major dashboard section.
4. Optional feature-of-month/editorial panel in `app/kpis/page.tsx`, where it clarifies a curated narrative rather than live data scanning.
5. Tab state, focused/selected period control, and high-level chart legend identity, where the shape reinforces an actual state.

**Prohibited placements:**

1. Every KPI card, each grid/table cell, input, chart bar/point, legend dot, empty state, or row hover.
2. `WeeklyDataGrid`, `RevenueBreakdownTable`, `ReceptionistMonthTable`, and other data-entry tables: keep rectangular cells, quiet borders, stable column alignment, and horizontal scrolling.
3. Dense Chart.js plot areas, axes, tick labels, tooltips, and data labels: decorative clipping impairs reading and can obscure data.
4. Validation/error states: shapes must not conceal field boundaries or replace text, ARIA state, and existing error presentation.
5. Logo/signature construction: no module may impersonate official trademark artwork.

## Ordered implementation plan

### Task 1: Capture baseline and protect in-progress work

**Objective:** Establish a reviewable before-state and isolate decisions from pre-existing local work.

**Files:**
- Inspect: `AGENTS.md`, `package.json`, `README.md`, `app/globals.css`, `app/layout.tsx`, `app/kpis/layout.tsx`, `app/kpis/layout.module.css`, `app/kpis/page.module.css`, `app/kpis/Navbar.tsx`, `app/kpis/_components/DashboardHeader.tsx`
- Inspect: `app/kpis/page.tsx`, `app/kpis/_components/SectionCard.tsx`, `app/kpis/_components/SectionInsights.tsx`, `components/ui/card.tsx`, `components/ui/button.tsx`
- Inspect: `lib/kpis/card-bar-colors.ts` and every Chart.js component below `app/kpis/_components/`

**Steps:**
1. Run `git status --short` and `git diff -- <the six already-modified paths>` before changing anything.
2. Record screenshots at desktop (1440px) and narrow mobile (320px/375px) for `/login`, `/kpis`, `/kpis/entrada-dados`, and `/kpis/configuracoes` using representative seeded Supabase data.
3. Verify that the official manual and this plan are the reference for palette, geometry, typography, and asset decisions. Preserve the current content, metric values, route behavior, and form tab order.
4. Put the rebrand in a dedicated branch or in clearly separated commits. Do not bundle the pre-existing uncommitted visual changes without their owner’s review.

**Acceptance:** Before/after visual evidence, a documented diff baseline, and no source/data/API behavior changed in this task.

### Task 2: Install the official token and typography foundation

**Objective:** Normalize the app’s visual foundation without changing component behavior.

**Files:**
- Modify: `app/globals.css`
- Modify: `app/layout.tsx`
- Modify: `app/kpis/layout.tsx`
- Modify: `app/kpis/layout.module.css`
- Create: `app/kpis/kpi-brand.module.css`
- Optionally create after approved assets are supplied: `public/brand/` asset files and a license/source attribution note under `docs/`

**Steps:**
1. Replace the current global `#FAEDE4` with exact `#F4EDE4` and map shadcn `background`, `foreground`, `card`, `border`, `input`, `ring`, sidebar, and chart variables to semantic aliases.
2. Remove the root-level forced `color-scheme: dark` media rule unless deliberate dark-mode support is designed and tested. It can make browser-native form controls incompatible with the current light editorial UI.
3. Keep `Archivo` as the current real fallback in `app/kpis/layout.tsx`. Add the official Forma DJR Micro `next/font/local` setup only after receipt of licensed Regular/Medium/Bold webfont files, then use Forma first and Archivo/system fonts second. Do not claim the font has been loaded before the files exist.
4. Make `app/layout.tsx` use the typography variables intentionally: root/system fallback for login and global controls, KPI scoped font variables in `/kpis`. Preserve `lang="pt-BR"`.
5. Add the primitive stylesheet from the target visual system and import it only in the KPI layout/shell. Ensure it has no global selector that can unexpectedly alter shadcn UI outside `/kpis`.
6. Keep large metric type readable as tabular figures where appropriate (`font-variant-numeric: tabular-nums`), with normal body copy rather than forced all-caps for explanatory prose.

**Acceptance:** All core colors are tokenized; current loaded fonts still render if licensed assets are absent; raw legacy palette values have a tracked migration list; no external font/CDN or new package is introduced.

### Task 3: Reframe dashboard navigation and header, then section hierarchy

**Objective:** Apply the brand’s strongest visual gesture once at the page frame and use restrained hierarchy throughout the KPI dashboard.

**Files:**
- Modify: `app/kpis/Navbar.tsx`
- Modify: `app/kpis/_components/DashboardHeader.tsx`
- Modify: `app/kpis/_components/MonthSelector.tsx`
- Modify: `app/kpis/page.tsx`
- Modify: `app/kpis/_components/SectionCard.tsx`
- Modify: `app/kpis/page.module.css`
- Use: `app/kpis/kpi-brand.module.css`

**Steps:**
1. Replace raw Tailwind color literals in `Navbar.tsx` with semantic token utilities/classes. Keep a compact burgundy header, orange active state, readable inactive links, and correct keyboard focus visibility.
2. Replace the current textual “Panobianco” imitation in the navbar with an approved supplied signature/logo asset only after it is available. Until then retain accessible product text, not a faux brand mark; keep the exact contextual tagline in `DashboardHeader.tsx` only where appropriate.
3. Make the dashboard header a single editorial frame with one chamfer/edge and the month selector aligned as a functional control. Do not add a second decorative module to each header child.
4. Simplify `SectionCard`’s legacy `SectionColor` vocabulary (`green`, `blue`, `purple`, `pink`, `brown`) so titles use semantic section hierarchy rather than invented color identity. Either remove the presentation-only prop or replace it with a typed semantic treatment that has no unapproved hue values.
5. Make section headings text-first with a compact `brandMarker`/orange rule. Preserve the `badge` API only if a real period/status is shown; the current component receives `badge` but does not render it, so either remove the unused prop/call-site arguments or implement it accessibly as real metadata.
6. Retain a continuous `#F4EDE4` editorial canvas and white/light cards. Do not introduce a separate full-width container color that visually cuts the page in two.

**Acceptance:** `/kpis` reads as one calm editorial surface, its navigation/header is recognizably Panobianco without repeated decoration, and all section titles remain scannable at 200% zoom.

### Task 4: Make metric, insight, chart, and data colors semantic

**Objective:** Remove legacy rainbow/palette drift while preserving data interpretation.

**Files:**
- Modify: `app/kpis/page.module.css`
- Modify: `lib/kpis/card-bar-colors.ts`
- Modify: `app/kpis/_components/cards/VisaoGeralCardGrid.tsx`
- Modify: `app/kpis/_components/cards/RetencaoCardGrid.tsx`
- Modify: `app/kpis/_components/cards/FinanceiroCardGrid.tsx`
- Modify: `app/kpis/_components/cards/RoiCardGrid.tsx`
- Modify: `app/kpis/_components/cards/VendasMarketingCardGrid.tsx`
- Modify: `app/kpis/_components/SectionInsights.tsx`
- Modify: `app/kpis/MonthlySalesBarChart.tsx`
- Modify: `app/kpis/_components/financeiro/{ReceitaPorComposicao,ResultadoOperacionalChart}.tsx`
- Modify: `app/kpis/_components/retencao/{Inadimplencia,EvolucaoBaseDeAlunos}.tsx`
- Modify: `app/kpis/_components/roi/{ComposicaoInvestimento,SaldoRecuperar,RoiCharts}.tsx`
- Modify: `app/kpis/_components/projecao/{ProjecaoKpiCards,ProjecaoReceita,ProjecaoDespesas,ProjecaoAnalise}.tsx`
- Modify: `app/kpis/_components/vendas-marketing/{Composicao,Funnel,MonthlySales,PerformanceBySeller,WeeklyView}.tsx`
- Modify as needed: the associated `*.module.css` files in `financeiro`, `retencao`, `roi`, `projecao`, and `vendas-marketing`

**Steps:**
1. Replace `KPI_BAR` and `SALES_VM_BAR` raw colors with a documented semantic mapping. Separate “metric/domain series identity” from “positive/negative/neutral state” so a red/burgundy strip never silently means the same thing as a warning in a different section.
2. Remove hard-coded blues, greens, purples, slate values, orange near-matches, and pseudo-status colors from JSX and chart configuration. Supply the seven approved brand colors through a small chart-token adapter that returns CSS-compatible strings. Do not make a Chart.js component import a CSS Module merely to retrieve a variable.
3. Chart system: orange is the primary/current/selected series; burgundy is a strong comparison or negative series when the annotation says why; graphite/concrete are neutral historical/reference series; warm orange is a limited secondary comparison. White may separate stacked segments. Use line style, marker form, direct legend text, tooltip labels, and/or pattern when two series could otherwise be confused.
4. Preserve baseline/grid lines in low-emphasis concrete/graphite opacity, use black/graphite labels, and maintain tooltip/table-like values as the source of precise reading. Never use chamfer clipping inside a plot.
5. Update delta and insight treatments: an arrow/icon plus text (“acima/abaixo da meta”, “em queda”, etc.) must distinguish meaning independent of color. Keep `aria-hidden` only for truly redundant glyphs; readable body text must carry the state.
6. Keep KPI cards rectangular/light and use only a thin semantic edge/strip where it is useful. Do not put a brand module, shadow, or vivid fill on every KPI card.

**Acceptance:** No legacy blue/green/purple/gray palette literal remains in rebranded dashboard visualization/UI code without a documented functional exception; every chart has a readable legend/tooltip and does not depend on color alone; comparison data remains distinct for color-vision deficiencies.

### Task 5: Migrate data-entry, settings, login, and shared controls conservatively

**Objective:** Extend the new system to operational screens without damaging high-density input efficiency.

**Files:**
- Modify: `components/ui/button.tsx`
- Review/modify only where needed: `components/ui/card.tsx`, `components/ui/input.tsx`, `components/ui/tabs.tsx`, `components/ui/table.tsx`, and other affected primitives under `components/ui/`
- Modify: `app/login/page.tsx`
- Modify: `app/kpis/entrada-dados/entrada-dados-form.tsx`
- Modify: `app/kpis/entrada-dados/_components/{PageHeader,SaveButton,MonthlyTab,SalesMarketingTab,KpiFormSection,FunnelAndReceptionistsCard,ExpenseSection,KpiFieldInput,WeekyMismatchWarning,StatusAlert,FileUploadArea,MonthPickerControl}.tsx` (correct the actual `WeeklyMismatchWarning.tsx` spelling when locating the file)
- Modify: `app/kpis/entrada-dados/_components/{WeeklyDataGrid,RevenueBreakdownTable,ReceptionistMonthTable}.tsx` only for tokens and accessible state, not geometry
- Modify: `app/kpis/configuracoes/{SettingsForm.tsx,_components/*.tsx}`

**Steps:**
1. Add a scoped primary-control variant/class that uses orange plus `#161515` foreground when contrast verifies; do not assume white-on-orange is acceptable for all small text. Selected tabs, buttons, and save states share the same state semantics.
2. Keep generic shadcn controls rounded/standard when their compact footprint is important. Apply a single chamfer to high-level primary controls only, never to every input, checkbox, table cell, or icon button.
3. Convert `PageHeader.tsx` and `SettingsForm.tsx` faux “P” chamfer tiles into a semantic header marker or approved asset, not an invented logo. Align their title/fallback type scale with the dashboard header.
4. In `WeeklyDataGrid.tsx`, retain native `<table>`, rectangular columns, `overflow-x-auto`, existing `tabIndex` order, numeric alignment, border grid, and hover/focus behavior. Migrate `slate-*` utility colors to semantic surface/text/border utilities only. Its grouped headings may use a thin orange edge or quiet off-white surface, but no clip-path.
5. Audit the login and settings cards for token drift, then limit brand geometry to the login primary action/page frame and settings header. Keep fields and error messages conventional and accessible.
6. Centralize repeated utility strings only when it improves consistency across all of these screens; do not force a wholesale UI primitive rewrite for this rebrand.

**Acceptance:** Data entry retains its current dense keyboard workflow and readable grid at 320px horizontal-scroll viewport; no user-visible control loses focus, disabled, invalid, selected, hover, or loading state; forms do not rely on color-only validation.

### Task 6: Add asset governance and documentation

**Objective:** Make implementation dependencies and future maintenance explicit.

**Files:**
- Create or update: `docs/brand-assets.md`
- Create or update: `docs/visual-regression-checklist.md`
- Update this plan only if decisions differ from the approved manual

**Steps:**
1. Inventory required handoff assets: official positive/negative/monochrome signature variants, approved interface icons, and licensed Forma DJR Micro Regular/Medium/Bold webfont files. Record source, licensing/approval owner, intended repository path, and dark/light usage.
2. Specify that asset files must be committed locally under `public/brand/` or another versioned asset directory after approval, not linked from a third-party/CDN page. Record alt text/accessible-name rules for each signature use.
3. Document the module placement policy and token/Chart.js mapping as a design-system constraint for future screens.
4. Document visual test routes, viewport matrix, expected seeded data, and manual checks listed below.

**Acceptance:** An implementer can identify every required official asset and knows that no recreated/text/CSS logo may ship; future components have a documented choice between calm data surfaces and limited brand modules.

## Responsive and accessibility acceptance criteria

- Keyboard: all nav items, month controls, tabs, save/logout/recalculate controls, inputs, and collapse controls can be reached in a visible, ordered focus sequence. The visible outline meets the local background and is never hidden by `clip-path`/overflow.
- Screen readers: controls have labels; status/delta meaning is exposed in text; decorative module edges/icons are `aria-hidden`; chart canvases have a nearby text summary/table/legend sufficient to understand data.
- Contrast: verify foreground/background combinations against WCAG 2.2 AA using an actual checker, including black on orange, white on burgundy, graphite/black on off-white, secondary metadata on off-white/white, focus rings, disabled text, and chart legend labels. Do not approve based on palette intuition.
- Zoom/reflow: at 200% and 400% browser zoom, dashboard headings and metric values do not overlap controls; period navigation wraps or stacks without loss; no horizontal scrolling is introduced except intentionally scrollable data tables/charts.
- Mobile: verify at 320px, 375px, and 768px. KPI grids collapse intentionally, header controls remain reachable, charts retain labels/tooltips, and tables preserve their horizontal scroll rather than squeezing numeric cells.
- Motion: any hover/transition is subtle and honors `prefers-reduced-motion`; no motion conveys data meaning.
- Pointer/print: chamfer decoration must not overlay clickable targets or obscure selected/invalid states; print/export remains readable even if `clip-path` is unsupported.

## Verification sequence

Run these only after all visual tasks are implemented, from `/Users/guilhermeluchesi/Dev/panobianco-dashboard`:

```bash
# Confirm source scope and unintended formatting/whitespace errors.
git status --short
git diff --check

# Static health gates supplied by the repository.
npm run lint
npm run build

# Start the real app with its existing local Supabase prerequisites.
npx supabase --workdir infra start
npx supabase --workdir infra db reset
npm run dev
```

Then browser-review `/login`, `/kpis`, `/kpis/entrada-dados`, and `/kpis/configuracoes` at 1440px, 768px, 375px, and 320px with representative seeded data. Exercise month navigation, section-insight collapse/recalculate controls, active/inactive nav, tabs, form invalid/disabled/loading states, weekly-grid keyboard entry, chart legend/tooltips, and logout. Capture fresh before/after screenshots for review.

If `npm run lint` or `npm run build` fails, classify each failure as introduced by the rebrand or pre-existing; fix introduced failures before approval. Build/lint success is not visual approval. Do not claim browser QA is complete if the local Supabase environment, credentials, or browser automation blocks the rendered routes.

## Rollback plan

1. Use separate commits in this order: token/primitives, dashboard shell, visualization semantics, operational screens, docs/assets. Do not mix database/data-contract changes into them.
2. If the visual system regresses rendering, revert the most recent scoped commit first. The app continues to render because `kpi-brand.module.css` has rectangular no-`clip-path` fallbacks and components retain normal DOM semantics.
3. If a token substitution harms a particular chart/contrast state, restore only that semantic alias/adapter mapping and its visual test evidence, not a raw legacy color across the app.
4. If licensed Forma files or official assets are delayed or rejected, keep Archivo/system fallback and accessible textual product identification. Do not ship simulated trademark assets.
5. Re-run `git diff --check`, `npm run lint`, `npm run build`, and the affected browser route matrix after each rollback.

## Files expected to change

- Foundation: `app/globals.css`, `app/layout.tsx`, `app/kpis/layout.tsx`, `app/kpis/layout.module.css`, new `app/kpis/kpi-brand.module.css`.
- Dashboard frame: `app/kpis/Navbar.tsx`, `app/kpis/page.tsx`, `app/kpis/page.module.css`, `app/kpis/_components/{DashboardHeader,MonthSelector,SectionCard,SectionInsights}.tsx`.
- KPI/chart semantic color migration: `lib/kpis/card-bar-colors.ts`, all relevant card grids and Chart.js components under `app/kpis/_components/`, plus their CSS Modules.
- Operational UI: `components/ui/{button,card,input,tabs,table}.tsx` as necessary; login, data-entry, and settings files listed in Task 5.
- Documentation/assets: new `docs/brand-assets.md`, new `docs/visual-regression-checklist.md`, and approved files under `public/brand/` only after handoff.

No Supabase migration, seed, KPI data model, server action, parser, API route, package dependency, or test framework change is expected.
