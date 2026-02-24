/*
  # Add Marketing Cost Types
  
  1. Changes
    - Add `cost_type` column to marketing_costs (either 'commission' or 'fixed')
    - Add `fixed_amount` column for fixed-type marketing costs
    - Make commission-related fields nullable since fixed costs don't need them
    - Set default cost_type to 'commission' for existing records
    
  2. Notes
    - Commission-based costs calculate: price_plan * customers * rate
    - Fixed costs use the fixed_amount directly
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'marketing_costs' AND column_name = 'cost_type'
  ) THEN
    ALTER TABLE marketing_costs 
    ADD COLUMN cost_type text DEFAULT 'commission' NOT NULL,
    ADD COLUMN fixed_amount numeric DEFAULT 0;
  END IF;
END $$;