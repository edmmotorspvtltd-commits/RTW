-- Add missing columns
ALTER TABLE stock_types ADD COLUMN IF NOT EXISTS code VARCHAR(10);
ALTER TABLE stock_types ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update the data to have proper names (the current name column has codes!)
UPDATE stock_types SET code = name WHERE code IS NULL;

-- Now update names to proper names
UPDATE stock_types SET name = 'DAMAGED' WHERE code = 'DAMAGED';
UPDATE stock_types SET name = 'WASTAGE', code = 'V' WHERE name = 'V';
UPDATE stock_types SET name = 'EMPTY CONES', code = 'E' WHERE name = 'E';
UPDATE stock_types SET name = 'EMPTY BAGS', code = 'EB' WHERE name = 'EB';
UPDATE stock_types SET name = 'WEAVER RETURN', code = 'R' WHERE name = 'R';
UPDATE stock_types SET name = 'FRESH', code = 'F' WHERE name = 'F';
UPDATE stock_types SET name = 'KORA', code = 'K' WHERE name = 'K';
UPDATE stock_types SET name = 'WEFT BOTTOM', code = 'WFB' WHERE name = 'WFB';
UPDATE stock_types SET name = 'WARP BOTTOM', code = 'W' WHERE name = 'W';
UPDATE stock_types SET name = 'LOOSE', code = 'L' WHERE name = 'L';
UPDATE stock_types SET name = 'REWINDING JOBWORK', code = 'RJ' WHERE name = 'RJ';
UPDATE stock_types SET name = 'HALF MAAL', code = 'HFM' WHERE name = 'HFM';