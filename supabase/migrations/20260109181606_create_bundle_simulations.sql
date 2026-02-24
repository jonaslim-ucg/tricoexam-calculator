/*
  # Create Bundle Simulations Schema

  1. New Tables
    - `bundle_simulations`
      - `id` (uuid, primary key)
      - `scenario_id` (uuid, foreign key to forecast_scenarios)
      - `name` (text) - Name of the simulation
      - `description` (text) - Description of bundling strategy
      - `bundle_config` (jsonb) - Configuration of which features are bundled
      - `adjusted_plan_prices` (jsonb) - Adjusted pricing for plans
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Notes
    - bundle_config structure: { planId: [featureIds] }
    - adjusted_plan_prices structure: { planId: newPrice }
    - This allows flexible simulation of different bundling strategies

  3. Security
    - Enable RLS with public access policies for demo
*/

CREATE TABLE IF NOT EXISTS bundle_simulations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id uuid REFERENCES forecast_scenarios(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  bundle_config jsonb NOT NULL DEFAULT '{}',
  adjusted_plan_prices jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE bundle_simulations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to bundle_simulations"
  ON bundle_simulations FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow public insert access to bundle_simulations"
  ON bundle_simulations FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow public update access to bundle_simulations"
  ON bundle_simulations FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete access to bundle_simulations"
  ON bundle_simulations FOR DELETE
  TO anon, authenticated
  USING (true);