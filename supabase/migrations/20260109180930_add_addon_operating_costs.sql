/*
  # Add Operating Costs for Add-on Features

  1. Changes
    - Add `operating_cost_per_customer` column to `add_on_features` table
    - This tracks the cost to provide each add-on feature per customer
    - Defaults to 0 for existing features

  2. Notes
    - Add-on features now have both revenue (price) and cost (operating_cost_per_customer)
    - This allows tracking the net profit contribution of each add-on feature
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'add_on_features' AND column_name = 'operating_cost_per_customer'
  ) THEN
    ALTER TABLE add_on_features ADD COLUMN operating_cost_per_customer decimal NOT NULL DEFAULT 0;
  END IF;
END $$;