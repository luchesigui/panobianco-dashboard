ALTER TABLE crm_sync_jobs
  ADD COLUMN IF NOT EXISTS unmatched_items jsonb NOT NULL DEFAULT '[]';
