# Panobianco 2026 brand assets

The 2026 visual implementation uses only CSS geometry and the approved palette until official files are handed off. CSS/text must **not** imitate a logo, signature, icon, or font.

## Required handoff

| Asset | Required variants | Intended path | Usage |
| --- | --- | --- | --- |
| Institutional signature | positive, negative, monochrome/tagline as approved | `public/brand/` | Supplied logo/signature contexts only; give an accessible name when it identifies the product, otherwise `alt=""`. |
| Interface icons | approved solid geometric SVG set | `public/brand/icons/` | Brand-semantic UI only; functional Lucide icons remain familiar action affordances. |
| Forma DJR Micro | licensed Regular, Medium, Bold webfonts | `public/brand/fonts/` | Add with `next/font/local` only after license and hosting approval. Archivo remains the actual fallback meanwhile. |

## Governance

- Source, license, approval owner, and light/dark usage must be recorded with each delivered asset.
- Commit approved local files to the repository; do not hotlink a third-party/CDN asset.
- The contextual text signature, when appropriate, is exactly: `Panobianco. Feitos de força e vontade.`
- Do not build a lockup from text or CSS. The navbar intentionally retains accessible product text until an approved asset is supplied.

## Module placement

`app/kpis/kpi-brand.module.css` is limited to an editorial header frame, active navigation/control states, and section markers. Dense KPI cards, table cells, inputs, chart plots, tooltips, and validation states remain rectangular and conventional.

## Chart mapping

`lib/kpis/card-bar-colors.ts` defines the CSS-compatible mapping: orange = current/primary, warm orange = limited secondary comparison, burgundy = explicit comparison/negative only with explanatory copy, graphite/concrete = neutral/reference, white = stack separation. Charts must retain legends/tooltips and not use color as the only meaning.
