CREATE TABLE IF NOT EXISTS gym_settings (
  gym_id     uuid        NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  key        text        NOT NULL,
  value      text        NOT NULL,
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (gym_id, key)
);
