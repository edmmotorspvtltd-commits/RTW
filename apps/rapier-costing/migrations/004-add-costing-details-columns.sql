-- Migration: Add warp, weft, and charges data columns to costing_sheets
-- Description: Adds JSONB columns to store detailed costing information

-- Add warp_data column
ALTER TABLE costing_sheets 
ADD COLUMN IF NOT EXISTS warp_data JSONB;

-- Add weft_data column
ALTER TABLE costing_sheets 
ADD COLUMN IF NOT EXISTS weft_data JSONB;

-- Add charges_data column
ALTER TABLE costing_sheets 
ADD COLUMN IF NOT EXISTS charges_data JSONB;

-- Add comments for documentation
COMMENT ON COLUMN costing_sheets.warp_data IS 'JSON array of warp yarn details (count, yarn type, supplier, rate, ends, total)';
COMMENT ON COLUMN costing_sheets.weft_data IS 'JSON array of weft yarn details (count, yarn type, supplier, rate, picks, total)';
COMMENT ON COLUMN costing_sheets.charges_data IS 'JSON object of various charges (warp cost, weft cost, sizing charges, job charges, other charges, production cost)';

-- Verify columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'costing_sheets' 
AND column_name IN ('warp_data', 'weft_data', 'charges_data');
