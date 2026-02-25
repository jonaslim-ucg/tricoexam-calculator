/*
  # Plan Add-on Rows (per plan: staff / provider add-ons)

  - plan_addon_rows
    - scenario_id, plan_id (FK pricing_plans), plan_name (denormalized)
    - addon_type: 'additional_staff' | 'additional_provider'
    - price, quantity
  Revenue = sum(price * quantity) per plan
*/

CREATE TABLE IF NOT EXISTS plan_addon_rows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id uuid NOT NULL REFERENCES forecast_scenarios(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES pricing_plans(id) ON DELETE CASCADE,
  plan_name text NOT NULL,
  addon_type text NOT NULL CHECK (addon_type IN ('additional_staff', 'additional_provider')),
  price decimal NOT NULL DEFAULT 0,
  quantity integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(scenario_id, plan_id, addon_type)
);

CREATE INDEX IF NOT EXISTS idx_plan_addon_rows_scenario ON plan_addon_rows(scenario_id);

ALTER TABLE plan_addon_rows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to plan_addon_rows"
  ON plan_addon_rows FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public insert access to plan_addon_rows"
  ON plan_addon_rows FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow public update access to plan_addon_rows"
  ON plan_addon_rows FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete access to plan_addon_rows"
  ON plan_addon_rows FOR DELETE TO anon, authenticated USING (true);
