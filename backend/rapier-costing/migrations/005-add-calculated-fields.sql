-- ================================================
-- Migration: Add Calculated Fields to Costing Sheets
-- Date: 2026-01-26
-- Description: Adds all 22 calculated fields for automatic calculation
-- ================================================

-- Add calculated cost fields
ALTER TABLE costing_sheets ADD COLUMN IF NOT EXISTS total_warp_cost DECIMAL(10, 2);
ALTER TABLE costing_sheets ADD COLUMN IF NOT EXISTS total_weft_cost DECIMAL(10, 2);
ALTER TABLE costing_sheets ADD COLUMN IF NOT EXISTS net_warp_total DECIMAL(10, 2);
ALTER TABLE costing_sheets ADD COLUMN IF NOT EXISTS net_weft_total DECIMAL(10, 2);

-- Add GLM/GSM fields
ALTER TABLE costing_sheets ADD COLUMN IF NOT EXISTS warp_glm_total DECIMAL(10, 2);
ALTER TABLE costing_sheets ADD COLUMN IF NOT EXISTS weft_glm_total DECIMAL(10, 2);
ALTER TABLE costing_sheets ADD COLUMN IF NOT EXISTS glm_per_meter DECIMAL(10, 2);
ALTER TABLE costing_sheets ADD COLUMN IF NOT EXISTS gsm_per_meter DECIMAL(10, 2);
ALTER TABLE costing_sheets ADD COLUMN IF NOT EXISTS yarn_required DECIMAL(10, 2);

-- Add charges fields
ALTER TABLE costing_sheets ADD COLUMN IF NOT EXISTS additional_charges DECIMAL(10, 2);
ALTER TABLE costing_sheets ADD COLUMN IF NOT EXISTS job_rate_percentage DECIMAL(5, 2);
ALTER TABLE costing_sheets ADD COLUMN IF NOT EXISTS job_charges_per_mtr DECIMAL(10, 2);
ALTER TABLE costing_sheets ADD COLUMN IF NOT EXISTS expenses_percentage DECIMAL(5, 2);
ALTER TABLE costing_sheets ADD COLUMN IF NOT EXISTS expenses_per_mtr DECIMAL(10, 2);
ALTER TABLE costing_sheets ADD COLUMN IF NOT EXISTS brokerage_percentage DECIMAL(5, 2);
ALTER TABLE costing_sheets ADD COLUMN IF NOT EXISTS brokerage_per_mtr DECIMAL(10, 2);

-- Add pricing fields
ALTER TABLE costing_sheets ADD COLUMN IF NOT EXISTS production_cost DECIMAL(10, 2);
ALTER TABLE costing_sheets ADD COLUMN IF NOT EXISTS minimum_selling_price DECIMAL(10, 2);
ALTER TABLE costing_sheets ADD COLUMN IF NOT EXISTS net_profit_per_mtr DECIMAL(10, 2);

-- Add total fields
ALTER TABLE costing_sheets ADD COLUMN IF NOT EXISTS total_production_cost DECIMAL(12, 2);
ALTER TABLE costing_sheets ADD COLUMN IF NOT EXISTS total_net_profit DECIMAL(12, 2);

-- Add metadata
ALTER TABLE costing_sheets ADD COLUMN IF NOT EXISTS calculated_at TIMESTAMP;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_costing_sheets_calculated_at ON costing_sheets(calculated_at);
CREATE INDEX IF NOT EXISTS idx_costing_sheets_production_cost ON costing_sheets(production_cost);
CREATE INDEX IF NOT EXISTS idx_costing_sheets_profit_percentage ON costing_sheets(profit_percentage);

-- Add comments
COMMENT ON COLUMN costing_sheets.total_warp_cost IS 'Sum of all warp costs per meter';
COMMENT ON COLUMN costing_sheets.total_weft_cost IS 'Sum of all weft costs per meter';
COMMENT ON COLUMN costing_sheets.glm_per_meter IS 'Grams per linear meter';
COMMENT ON COLUMN costing_sheets.gsm_per_meter IS 'Grams per square meter';
COMMENT ON COLUMN costing_sheets.production_cost IS 'Total production cost per meter';
COMMENT ON COLUMN costing_sheets.minimum_selling_price IS 'Minimum selling price (production cost + 15%)';
COMMENT ON COLUMN costing_sheets.net_profit_per_mtr IS 'Net profit per meter (selling price - production cost)';
COMMENT ON COLUMN costing_sheets.profit_percentage IS 'Profit percentage ((net profit / production cost) * 100)';
