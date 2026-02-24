/*
  # Add adjusted plan customers column

  1. Changes
    - Add `adjusted_plan_customers` column to `bundle_simulations` table
    - This column stores custom customer counts for each plan in the simulation
    - Uses JSONB type to match the structure of `adjusted_plan_prices`

  2. Notes
    - Existing simulations will have NULL values for this column
    - The application will fall back to original customer counts when this is NULL
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bundle_simulations' AND column_name = 'adjusted_plan_customers'
  ) THEN
    ALTER TABLE bundle_simulations ADD COLUMN adjusted_plan_customers jsonb;
  END IF;
END $$;
