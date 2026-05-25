# Implementation Plan: Panobianco Dashboard APIs

Implement the backend routes to parse and save the uploaded Excel reports (recebimentos, custos, crescimento, recuperacao, conversion).

## Proposed Changes

### 1. API Route Modifications for existing parse endpoints:
- Modify `/api/parse/recebimentos/route.ts`
- Modify `/api/parse/custos/route.ts`
- Modify `/api/parse/crescimento/route.ts`
- Modify `/api/parse/recuperacao/route.ts`

For each route:
- Check for `Authorization: Bearer <CRON_SECRET>` in headers.
- If a query parameter `save=true` is passed and the request is authorized:
  - Extract query params `gym` (default: `panobianco-sjc-satelite`) and `period` (format `YYYY-MM-DD`).
  - Parse the Excel spreadsheet.
  - Save the parsed metrics using `saveMonthlyKpisAction`.
  - Return `{ ok: true }` along with the parsed data.

### 2. New Conversion Route:
- Create `/api/parse/conversion/route.ts`
- It will parse `Cadastrados_Convertidos.xlsx`.
- Extract:
  - `totalLeads` = row count.
  - `totalSales` = count of rows with non-empty `Conversão` date.
  - Group by `Cadastrado por`: count of registered rows (leads) and converted rows (sales).
- If `save=true` and authorized:
  - Load active consultoras using `loadConsultorasAction()`.
  - Match names (first-name case-insensitive matching).
  - Load existing `sales_marketing_dashboard_payload` or create default.
  - Update `weekly.salesWeekly.leadsByWeek[weekIndex] = totalLeads` and `weekly.salesWeekly.totals[weekIndex] = totalSales`.
  - For each receptionist, update `leadsByWeek[weekIndex]` and `salesByWeek[weekIndex]` in `weekly.salesWeekly.byReceptionist`.
  - Recalculate monthly totals for receptionists in `payload.receptionists` (leads, sales, conversion_pct).
  - Call `recomputeWeeklyTotals(payload.weekly)`.
  - Call `saveSmDashboardAction` to save the payload.
  - Call `saveMonthlyKpisAction` to write `leads_generated` and `sales_total` to `kpi_values`.

## Verification Plan
- Run the dashboard server locally: `npm run dev`.
- Make API requests with a mock CRON_SECRET using `curl` or a test script to check the parsing and DB upserts.
