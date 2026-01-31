-- ============================================================
-- RTWE ERP - COMPLETE ADD-ON INTEGRATION SCHEMA
-- Combined: Company Management + Rapier Costing
-- PostgreSQL 14+
-- Created: January 11, 2026
-- ============================================================

-- ============================================================
-- PART 1: COMPANY MANAGEMENT SYSTEM
-- ============================================================

-- 1. COMPANIES TABLE
CREATE TABLE IF NOT EXISTS companies (
    id SERIAL PRIMARY KEY,
    company_code VARCHAR(50) UNIQUE NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    company_type VARCHAR(50) CHECK (company_type IN ('trading', 'manufacturing', 'both')),
    
    -- Owner Information
    owner_name VARCHAR(255) NOT NULL,
    owner_email VARCHAR(255) NOT NULL,
    owner_phone VARCHAR(20) NOT NULL,
    alternate_phone VARCHAR(20),
    
    -- Address Information
    address_line1 TEXT NOT NULL,
    address_line2 TEXT,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    
    -- Legal Information
    gst_number VARCHAR(15) UNIQUE,
    pan_number VARCHAR(10) UNIQUE,
    tan_number VARCHAR(10),
    cin_number VARCHAR(21),
    registration_date DATE NOT NULL,
    
    -- Status and Metadata
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    notes TEXT,
    
    -- Audit Fields
    created_by INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for companies
CREATE INDEX IF NOT EXISTS idx_companies_code ON companies(company_code);
CREATE INDEX IF NOT EXISTS idx_companies_status ON companies(status);
CREATE INDEX IF NOT EXISTS idx_companies_gst ON companies(gst_number) WHERE gst_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_companies_created_at ON companies(created_at DESC);

-- 2. UNITS TABLE
CREATE TABLE IF NOT EXISTS units (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    unit_code VARCHAR(50) UNIQUE NOT NULL,
    unit_name VARCHAR(255) NOT NULL,
    unit_type VARCHAR(50) CHECK (unit_type IN ('manufacturing', 'processing', 'warehouse', 'distribution', 'office')),
    
    -- Location Information
    location VARCHAR(255) NOT NULL,
    address_line1 TEXT,
    address_line2 TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    
    -- Manager Information
    manager_name VARCHAR(255),
    manager_email VARCHAR(255),
    manager_phone VARCHAR(20),
    
    -- Capacity Information
    production_capacity INTEGER,
    max_employees INTEGER,
    
    -- Status and Metadata
    is_active BOOLEAN DEFAULT true,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance', 'under_construction')),
    
    -- Audit Fields
    created_by INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for units
CREATE INDEX IF NOT EXISTS idx_units_company ON units(company_id);
CREATE INDEX IF NOT EXISTS idx_units_code ON units(unit_code);
CREATE INDEX IF NOT EXISTS idx_units_status ON units(status);
CREATE INDEX IF NOT EXISTS idx_units_active ON units(is_active);

-- Insert default company and unit for existing system
INSERT INTO companies (
    company_code, company_name, company_type,
    owner_name, owner_email, owner_phone,
    address_line1, city, state, pincode,
    registration_date, status
) VALUES (
    'RTWE-001', 'RTWE Textiles', 'both',
    'Management', 'admin@rtwe.com', '0000000000',
    'Ichal Karanji Industrial Area', 'Ichalkaranji', 'Maharashtra', '416115',
    CURRENT_DATE, 'active'
) ON CONFLICT (company_code) DO NOTHING;

INSERT INTO units (
    company_id, unit_code, unit_name, unit_type,
    location, address_line1, city, state, pincode,
    is_active
) VALUES (
    1, 'HO-001', 'Head Office', 'office',
    'Ichalkaranji, Maharashtra', 'Main Office', 'Ichalkaranji', 'Maharashtra', '416115',
    true
) ON CONFLICT (unit_code) DO NOTHING;

-- ============================================================
-- PART 2: RAPIER COSTING CALCULATOR
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PARTIES (Master Data)
CREATE TABLE IF NOT EXISTS parties (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    party_name VARCHAR(200) NOT NULL,
    contact_person VARCHAR(200),
    phone VARCHAR(20),
    email VARCHAR(200),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    gst_number VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_parties_company_id ON parties(company_id);
CREATE INDEX IF NOT EXISTS idx_parties_name ON parties(party_name);

-- 2. BROKERS
CREATE TABLE IF NOT EXISTS brokers (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    broker_name VARCHAR(200) NOT NULL,
    contact_person VARCHAR(200),
    phone VARCHAR(20),
    email VARCHAR(200),
    commission_percentage DECIMAL(5,2) DEFAULT 1.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_brokers_company_id ON brokers(company_id);
CREATE INDEX IF NOT EXISTS idx_brokers_name ON brokers(broker_name);

-- 3. COSTING SHEETS (Main Table)
CREATE TABLE IF NOT EXISTS costing_sheets (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    unit_id INTEGER REFERENCES units(id) ON DELETE SET NULL,
    
    -- Order Information
    order_number VARCHAR(100),
    order_length DECIMAL(12,2) NOT NULL,
    party_id INTEGER REFERENCES parties(id) ON DELETE SET NULL,
    party_name VARCHAR(200),
    broker_id INTEGER REFERENCES brokers(id) ON DELETE SET NULL,
    broker_name VARCHAR(200),
    quality_type VARCHAR(200),
    sizing_set_no VARCHAR(100),
    
    -- Pricing & Results
    production_cost_per_mtr DECIMAL(10,2),
    production_cost_per_taga DECIMAL(10,2),
    minimum_selling_price DECIMAL(10,2),
    selling_price DECIMAL(10,2),
    net_profit_per_mtr DECIMAL(10,2),
    net_profit_total DECIMAL(12,2),
    profit_percentage DECIMAL(5,2),
    
    -- Weight Summary
    total_warp_glm DECIMAL(10,4),
    total_weft_glm DECIMAL(10,4),
    glm_per_meter DECIMAL(10,4),
    gsm_per_meter DECIMAL(10,4),
    
    -- Job Charges
    job_rate_percentage DECIMAL(5,2),
    job_charges_per_mtr DECIMAL(10,2),
    job_charges_per_pick DECIMAL(10,4),
    pick_value INTEGER,
    
    -- Percentages
    expenses_percentage DECIMAL(5,2) DEFAULT 5.00,
    brokerage_percentage DECIMAL(5,2) DEFAULT 1.00,
    vatav_percentage DECIMAL(5,2) DEFAULT 0.00,
    
    -- Status & Metadata
    status VARCHAR(50) DEFAULT 'draft',
    is_template BOOLEAN DEFAULT false,
    template_name VARCHAR(200),
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    calculated_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_costing_company_id ON costing_sheets(company_id);
CREATE INDEX IF NOT EXISTS idx_costing_unit_id ON costing_sheets(unit_id);
CREATE INDEX IF NOT EXISTS idx_costing_order_number ON costing_sheets(order_number);
CREATE INDEX IF NOT EXISTS idx_costing_party_id ON costing_sheets(party_id);
CREATE INDEX IF NOT EXISTS idx_costing_status ON costing_sheets(status);

-- 4. WARP CONFIGURATIONS
CREATE TABLE IF NOT EXISTS warp_configurations (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
    costing_sheet_id INTEGER REFERENCES costing_sheets(id) ON DELETE CASCADE,
    warp_index INTEGER NOT NULL,
    
    panna DECIMAL(10,2),
    rs_gap DECIMAL(10,2),
    dbf DECIMAL(10,2),
    reed INTEGER,
    total_ends INTEGER,
    warp_count DECIMAL(10,2),
    rate_of_yarn DECIMAL(10,2),
    rate_of_sizing DECIMAL(10,2),
    crimping INTEGER DEFAULT 103,
    
    no_of_ends_in_top_beam INTEGER,
    count_of_top_beam DECIMAL(10,2),
    no_of_ends_in_bobin INTEGER,
    beam_length DECIMAL(10,2),
    no_of_cuts_sizing INTEGER,
    jari_length DECIMAL(10,2),
    
    warp_glm DECIMAL(10,7),
    warp_glm_with_wastage DECIMAL(10,7),
    cost_per_meter DECIMAL(10,2),
    cost_per_taga DECIMAL(10,2),
    yarn_required_kgs DECIMAL(10,2),
    
    top_beam_charges BOOLEAN DEFAULT false,
    bobin_charges BOOLEAN DEFAULT false,
    top_beam_amount DECIMAL(10,2) DEFAULT 0.50,
    bobin_amount DECIMAL(10,2) DEFAULT 0.50,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(costing_sheet_id, warp_index)
);

CREATE INDEX IF NOT EXISTS idx_warp_costing_id ON warp_configurations(costing_sheet_id);

-- 5. WEFT CONFIGURATIONS
CREATE TABLE IF NOT EXISTS weft_configurations (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
    costing_sheet_id INTEGER REFERENCES costing_sheets(id) ON DELETE CASCADE,
    weft_index INTEGER NOT NULL,
    
    rs DECIMAL(10,2),
    pick INTEGER,
    insertion DECIMAL(10,2),
    weft_count DECIMAL(10,2),
    rate_of_yarn DECIMAL(10,2),
    percentage_of_total_weft DECIMAL(5,2),
    
    denier DECIMAL(10,2),
    cotton_rate DECIMAL(10,2),
    
    weft_consumption DECIMAL(10,7),
    weft_wastage DECIMAL(10,7),
    total_weft_glm DECIMAL(10,7),
    cost_per_meter DECIMAL(10,2),
    cost_per_taga DECIMAL(10,2),
    yarn_required_kgs DECIMAL(10,2),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(costing_sheet_id, weft_index)
);

CREATE INDEX IF NOT EXISTS idx_weft_costing_id ON weft_configurations(costing_sheet_id);

-- 6. OPTIONAL CHARGES
CREATE TABLE IF NOT EXISTS optional_charges (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
    costing_sheet_id INTEGER REFERENCES costing_sheets(id) ON DELETE CASCADE,
    
    monogram_charges BOOLEAN DEFAULT false,
    monogram_amount DECIMAL(10,2) DEFAULT 1.00,
    butta_charges BOOLEAN DEFAULT false,
    butta_amount DECIMAL(10,2) DEFAULT 2.00,
    other_charges_description VARCHAR(200),
    other_charges_amount DECIMAL(10,2) DEFAULT 0.00,
    total_optional_charges DECIMAL(10,2) DEFAULT 0.00,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(costing_sheet_id)
);

-- 7. COST BREAKDOWN
CREATE TABLE IF NOT EXISTS cost_breakdown (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
    costing_sheet_id INTEGER REFERENCES costing_sheets(id) ON DELETE CASCADE,
    
    warp_cost DECIMAL(10,2),
    warp_percentage DECIMAL(5,2),
    weft_cost DECIMAL(10,2),
    weft_percentage DECIMAL(5,2),
    sizing_cost DECIMAL(10,2),
    sizing_percentage DECIMAL(5,2),
    job_charges_cost DECIMAL(10,2),
    job_charges_percentage DECIMAL(5,2),
    optional_charges_cost DECIMAL(10,2),
    optional_charges_percentage DECIMAL(5,2),
    expenses_cost DECIMAL(10,2),
    brokerage_cost DECIMAL(10,2),
    vatav_cost DECIMAL(10,2),
    total_production_cost DECIMAL(10,2),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(costing_sheet_id)
);

-- 8. COSTING TEMPLATES
CREATE TABLE IF NOT EXISTS costing_templates (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    template_name VARCHAR(200) NOT NULL,
    description TEXT,
    template_costing_sheet_id INTEGER REFERENCES costing_sheets(id) ON DELETE CASCADE,
    is_public BOOLEAN DEFAULT false,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. COSTING SYSTEM SETTINGS
INSERT INTO system_settings (setting_key, setting_value, setting_type, description) VALUES
('costing_default_crimping', '103', 'number', 'Default crimping factor for costing'),
('costing_default_expenses_percentage', '5', 'number', 'Default expenses percentage'),
('costing_default_brokerage_percentage', '1', 'number', 'Default brokerage percentage'),
('costing_weft_wastage_percentage', '5', 'number', 'Weft wastage percentage')
ON CONFLICT (setting_key) DO NOTHING;

-- ============================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER IF NOT EXISTS update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_units_updated_at BEFORE UPDATE ON units
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_parties_updated_at BEFORE UPDATE ON parties
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_brokers_updated_at BEFORE UPDATE ON brokers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_costing_sheets_updated_at BEFORE UPDATE ON costing_sheets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- SUCCESS MESSAGE
-- ============================================================

DO $$
BEGIN
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'RTWE ERP - ADD-ON SYSTEMS INTEGRATED SUCCESSFULLY';
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'Company Management: Companies, Units tables created';
    RAISE NOTICE 'Rapier Costing: 8 costing tables created';
    RAISE NOTICE 'Default company (RTWE-001) and unit (HO-001) created';
    RAISE NOTICE '============================================================';
END $$;
