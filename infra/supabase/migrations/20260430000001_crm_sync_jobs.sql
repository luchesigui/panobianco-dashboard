CREATE TABLE crm_sync_jobs (
  id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  gym_id          uuid        NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  status          text        NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  due_date_start  date        NOT NULL,
  due_date_end    date        NOT NULL,
  skip_position   int         NOT NULL DEFAULT 0,
  total_fetched   int         NOT NULL DEFAULT 0,
  partial_groups  jsonb       NOT NULL DEFAULT '{}',
  revenue_centers jsonb       NOT NULL DEFAULT '{}',
  error           text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE INDEX ON crm_sync_jobs (gym_id, due_date_start, due_date_end, status);
