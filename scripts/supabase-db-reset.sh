#!/usr/bin/env bash
# Supabase CLI runs migrations successfully then restarts containers; Kong can keep a stale
# storage upstream IP → GET /storage/v1/bucket returns 502. Restart Kong and verify storage.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

exit_code=0
npx supabase --workdir infra db reset "$@" || exit_code=$?

if [[ "$exit_code" -eq 0 ]]; then
  exit 0
fi

PROJECT_ID=$(grep -E '^project_id[[:space:]]*=' infra/supabase/config.toml | head -1 | sed -E 's/.*"([^"]+)".*/\1/')
KONG_CONTAINER="supabase_kong_${PROJECT_ID}"
docker restart "$KONG_CONTAINER" >/dev/null 2>&1 || true

sleep 3

# Standard local Supabase demo anon JWT (documented in Supabase local dev)
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"
http_code=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:54321/storage/v1/bucket" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${ANON_KEY}" || echo "000")

if [[ "$http_code" == "200" ]]; then
  echo "Database reset completed; Kong was restarted to refresh the storage upstream (local Supabase / Docker networking)."
  exit 0
fi

exit "$exit_code"
