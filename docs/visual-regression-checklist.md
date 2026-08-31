# KPI dashboard visual regression checklist

## Routes and viewports

Review `/login`, `/kpis`, `/kpis/entrada-dados`, and `/kpis/configuracoes` with representative seeded Supabase data at 1440px, 768px, 375px, and 320px. At 320px, only data tables/charts may intentionally scroll horizontally.

## Manual interaction checks

- Keyboard navigation: nav links, month previous/next controls, tabs, save/logout/recalculate, inputs, and collapse controls have an ordered, visible focus state.
- KPI dashboard: changing the period preserves existing query state; active navigation is visible; section headings and period metadata remain readable at 200% and 400% zoom.
- Data entry: enter values in the weekly grid by keyboard; verify native table alignment, horizontal scrolling, disabled/loading/invalid feedback, and selected tabs.
- Charts: inspect legends/tooltips and nearby textual labels; comparison/current series must remain distinguishable beyond color.
- Reduced motion: hover/transition effects do not communicate a data state.
- Print/no clip-path fallback: content is still rectangular, readable, and actionable.

## Brand checks

- Exact `#F4EDE4` canvas; official approved token palette only.
- Chamfers are 45-degree, sparse, and never generic octagons.
- No CSS/text approximation of the logo, signature, brand icon, or Forma font.
- Dense KPI cards/tables/inputs/plots remain calm and rectangular.
- Check WCAG 2.2 AA for black on orange, white on burgundy, primary/secondary text on off-white and white, focus rings, disabled text, and chart labels with an actual contrast checker.
