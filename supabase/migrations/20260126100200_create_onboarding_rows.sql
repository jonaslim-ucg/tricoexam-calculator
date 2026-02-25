/*
  # Onboarding rows (one-time session/bundle offerings)

  - onboarding_rows
    - scenario_id, plan_id (text - can be pricing_plans.id or custom id e.g. custom-session-xxx)
    - plan_name (editable label)
    - upgrade_type: 'session' | 'bundle'
    - price, customers, delivery_cost (nullable, per-row override)
*/

CREATE TABLE IF NOT EXISTS onboarding_rows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id uuid NOT NULL REFERENCES forecast_scenarios(id) ON DELETE CASCADE,
  plan_id text NOT NULL,
  plan_name text NOT NULL DEFAULT '',
  upgrade_type text NOT NULL CHECK (upgrade_type IN ('session', 'bundle')),
  price decimal NOT NULL DEFAULT 0,
  customers integer NOT NULL DEFAULT 0,
  delivery_cost decimal,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_onboarding_rows_scenario ON onboarding_rows(scenario_id);

ALTER TABLE onboarding_rows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to onboarding_rows"
  ON onboarding_rows FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public insert access to onboarding_rows"
  ON onboarding_rows FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow public update access to onboarding_rows"
  ON onboarding_rows FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete access to onboarding_rows"
  ON onboarding_rows FOR DELETE TO anon, authenticated USING (true);
