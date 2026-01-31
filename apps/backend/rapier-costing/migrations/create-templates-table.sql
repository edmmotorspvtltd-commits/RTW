-- Quick script to create the costing_templates table
-- Run this in your PostgreSQL database: rapier_costing_db

-- Drop table if exists (optional - only if you want to recreate)
-- DROP TABLE IF EXISTS costing_templates CASCADE;

-- Create the table
CREATE TABLE IF NOT EXISTS costing_templates (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    template_name VARCHAR(255) NOT NULL,
    company_id INTEGER,
    unit_id INTEGER,
    
    -- Basic Information
    order_number VARCHAR(100),
    order_length DECIMAL(10, 2),
    party_name VARCHAR(255),
    broker_name VARCHAR(255),
    quality_type VARCHAR(100),
    sizing_set_no VARCHAR(100),
    
    -- Warp Details (stored as JSONB for flexibility)
    warp_data JSONB,
    
    -- Weft Details (stored as JSONB for flexibility)
    weft_data JSONB,
    
    -- Charges (stored as JSONB for flexibility)
    charges_data JSONB,
    
    -- Calculated Values
    selling_price DECIMAL(10, 2),
    profit_percentage DECIMAL(5, 2),
    
    -- Metadata
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_templates_company ON costing_templates(company_id);
CREATE INDEX IF NOT EXISTS idx_templates_unit ON costing_templates(unit_id);
CREATE INDEX IF NOT EXISTS idx_templates_name ON costing_templates(template_name);
CREATE INDEX IF NOT EXISTS idx_templates_created_at ON costing_templates(created_at DESC);

-- Add comments for documentation
COMMENT ON TABLE costing_templates IS 'Stores reusable costing templates';
COMMENT ON COLUMN costing_templates.warp_data IS 'JSON array of warp yarn details';
COMMENT ON COLUMN costing_templates.weft_data IS 'JSON array of weft yarn details';
COMMENT ON COLUMN costing_templates.charges_data IS 'JSON object of various charges';

-- Verify table was created
SELECT 'Templates table created successfully!' as status;
SELECT COUNT(*) as template_count FROM costing_templates;
