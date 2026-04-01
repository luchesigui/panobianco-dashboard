# monthly-close Edge Function

This function calls the Postgres RPC `run_monthly_close` using the service role key.

## Required secrets

Set these in Supabase Dashboard -> Edge Functions -> `monthly-close` -> Secrets:

- `ADMIN_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Request

- Method: `POST`
- Header: `x-admin-api-key: <ADMIN_API_KEY>`
- JSON body (optional):
  - `household_id` (string, optional)
  - `period_month` (string, optional, format `YYYY-MM-01`)

If both values are omitted, the RPC should process all eligible households using its own defaults.

## Local test

```bash
npx supabase --workdir infra functions serve monthly-close --env-file .env.local
```

Then invoke:

```bash
curl -i "http://127.0.0.1:54321/functions/v1/monthly-close" \
  -X POST \
  -H "content-type: application/json" \
  -H "x-admin-api-key: $ADMIN_API_KEY" \
  -d '{"household_id": null, "period_month": null}'
```
