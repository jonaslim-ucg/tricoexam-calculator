/*
  # Tricoexam Revenue Forecast Dashboard Schema

  1. New Tables
    - `forecast_scenarios`
      - `id` (uuid, primary key)
      - `name` (text) - Name of the forecast scenario
      - `capital_expenditure` (decimal) - Initial development cost
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `pricing_plans`
      - `id` (uuid, primary key)
      - `scenario_id` (uuid, foreign key)
      - `name` (text) - Plan name (Basic, Professional, Enterprise)
      - `price` (decimal) - Monthly price per customer
      - `customers` (integer) - Number of customers
      - `display_order` (integer) - Order to display plans
      - `created_at` (timestamptz)
    
    - `add_on_features`
      - `id` (uuid, primary key)
      - `scenario_id` (uuid, foreign key)
      - `name` (text) - Feature name
      - `price` (decimal) - Price per customer
      - `customers` (integer) - Number of customers using this feature
      - `is_revenue` (boolean) - true for revenue, false for operating cost
      - `created_at` (timestamptz)
    
    - `operating_costs`
      - `id` (uuid, primary key)
      - `scenario_id` (uuid, foreign key)
      - `name` (text) - Cost item name
      - `amount` (decimal) - Monthly cost amount
      - `is_fixed` (boolean) - true for fixed costs, false for variable
      - `unit_price` (decimal) - Price per unit for variable costs
      - `units` (integer) - Number of units for variable costs
      - `created_at` (timestamptz)
    
    - `marketing_costs`
      - `id` (uuid, primary key)
      - `scenario_id` (uuid, foreign key)
      - `name` (text) - Marketing cost item name
      - `rate` (decimal) - Commission rate as percentage
      - `price_plan` (text) - Which pricing plan this applies to
      - `customers` (integer) - Number of customers
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for public access (for demo purposes)
*/

-- Create forecast_scenarios table
CREATE TABLE IF NOT EXISTS forecast_scenarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  capital_expenditure decimal NOT NULL DEFAULT 60000,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create pricing_plans table
CREATE TABLE IF NOT EXISTS pricing_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id uuid REFERENCES forecast_scenarios(id) ON DELETE CASCADE,
  name text NOT NULL,
  price decimal NOT NULL,
  customers integer NOT NULL DEFAULT 0,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create add_on_features table
CREATE TABLE IF NOT EXISTS add_on_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id uuid REFERENCES forecast_scenarios(id) ON DELETE CASCADE,
  name text NOT NULL,
  price decimal NOT NULL,
  customers integer NOT NULL DEFAULT 0,
  is_revenue boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create operating_costs table
CREATE TABLE IF NOT EXISTS operating_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id uuid REFERENCES forecast_scenarios(id) ON DELETE CASCADE,
  name text NOT NULL,
  amount decimal NOT NULL DEFAULT 0,
  is_fixed boolean NOT NULL DEFAULT true,
  unit_price decimal DEFAULT 0,
  units integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create marketing_costs table
CREATE TABLE IF NOT EXISTS marketing_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id uuid REFERENCES forecast_scenarios(id) ON DELETE CASCADE,
  name text NOT NULL,
  rate decimal NOT NULL,
  price_plan text NOT NULL,
  customers integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE forecast_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE add_on_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE operating_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_costs ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (demo purposes)
CREATE POLICY "Allow public read access to scenarios"
  ON forecast_scenarios FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow public insert access to scenarios"
  ON forecast_scenarios FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow public update access to scenarios"
  ON forecast_scenarios FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public read access to pricing_plans"
  ON pricing_plans FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow public insert access to pricing_plans"
  ON pricing_plans FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow public update access to pricing_plans"
  ON pricing_plans FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete access to pricing_plans"
  ON pricing_plans FOR DELETE
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow public read access to add_on_features"
  ON add_on_features FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow public insert access to add_on_features"
  ON add_on_features FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow public update access to add_on_features"
  ON add_on_features FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete access to add_on_features"
  ON add_on_features FOR DELETE
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow public read access to operating_costs"
  ON operating_costs FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow public insert access to operating_costs"
  ON operating_costs FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow public update access to operating_costs"
  ON operating_costs FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete access to operating_costs"
  ON operating_costs FOR DELETE
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow public read access to marketing_costs"
  ON marketing_costs FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow public insert access to marketing_costs"
  ON marketing_costs FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow public update access to marketing_costs"
  ON marketing_costs FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete access to marketing_costs"
  ON marketing_costs FOR DELETE
  TO anon, authenticated
  USING (true);