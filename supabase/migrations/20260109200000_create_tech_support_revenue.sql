/*
  # Tech Support Revenue (per plan × tier)

  - `tech_support_revenue`
    - scenario_id, plan_id (FK pricing_plans)
    - tier: 'Priority' | 'Urgent'
    - tier_price: upgrade price (covers included users)
    - customers: number of customers on this plan using this tier
    - seat_addon_price: per-seat add-on for extra users
    - extra_seats: number of extra support seats
  Revenue per row = tier_price * customers + seat_addon_price * extra_seats
*/

CREATE TABLE IF NOT EXISTS tech_support_revenue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id uuid NOT NULL REFERENCES forecast_scenarios(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES pricing_plans(id) ON DELETE CASCADE,
  tier text NOT NULL CHECK (tier IN ('Priority', 'Urgent')),
  tier_price decimal NOT NULL DEFAULT 0,
  customers integer NOT NULL DEFAULT 0,
  seat_addon_price decimal NOT NULL DEFAULT 0,
  extra_seats integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(scenario_id, plan_id, tier)
);

ALTER TABLE tech_support_revenue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to tech_support_revenue"
  ON tech_support_revenue FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public insert access to tech_support_revenue"
  ON tech_support_revenue FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow public update access to tech_support_revenue"
  ON tech_support_revenue FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete access to tech_support_revenue"
  ON tech_support_revenue FOR DELETE TO anon, authenticated USING (true);
