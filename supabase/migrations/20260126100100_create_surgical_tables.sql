/*
  # Surgical Services: tier rows + extras per scenario

  1. surgical_tier_rows - per plan per volume tier (base_price, addon_price, customers)
  2. surgical_extras - one row per scenario (additional provider, automation overage)
*/

-- Per-plan, per-tier rows (volume tier key: 0-10, 11-25, 26-50, 51-100, 100+)
CREATE TABLE IF NOT EXISTS surgical_tier_rows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id uuid NOT NULL REFERENCES forecast_scenarios(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES pricing_plans(id) ON DELETE CASCADE,
  plan_name text NOT NULL,
  base_price decimal NOT NULL DEFAULT 0,
  tier_key text NOT NULL CHECK (tier_key IN ('0-10', '11-25', '26-50', '51-100', '100+')),
  addon_price decimal NOT NULL DEFAULT 0,
  customers integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(scenario_id, plan_id, tier_key)
);

CREATE INDEX IF NOT EXISTS idx_surgical_tier_rows_scenario ON surgical_tier_rows(scenario_id);

ALTER TABLE surgical_tier_rows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to surgical_tier_rows"
  ON surgical_tier_rows FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public insert access to surgical_tier_rows"
  ON surgical_tier_rows FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow public update access to surgical_tier_rows"
  ON surgical_tier_rows FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete access to surgical_tier_rows"
  ON surgical_tier_rows FOR DELETE TO anon, authenticated USING (true);

-- One row per scenario for extras (additional provider price/qty, automation)
CREATE TABLE IF NOT EXISTS surgical_extras (
  scenario_id uuid PRIMARY KEY REFERENCES forecast_scenarios(id) ON DELETE CASCADE,
  additional_provider_price decimal NOT NULL DEFAULT 75,
  additional_provider_quantity integer NOT NULL DEFAULT 0,
  automation_price_per_1000 decimal NOT NULL DEFAULT 25,
  automation_overage_thousands decimal NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE surgical_extras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to surgical_extras"
  ON surgical_extras FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public insert access to surgical_extras"
  ON surgical_extras FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow public update access to surgical_extras"
  ON surgical_extras FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
