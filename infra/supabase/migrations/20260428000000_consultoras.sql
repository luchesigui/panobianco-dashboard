CREATE TABLE consultoras (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  gym_id       uuid NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  name         text NOT NULL,
  monthly_goal numeric(14,2),
  sort_order   int NOT NULL DEFAULT 0,
  deleted_at   timestamptz,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

CREATE INDEX ON consultoras (gym_id, deleted_at);
