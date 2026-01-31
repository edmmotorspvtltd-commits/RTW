-- ============================================================================
-- iTex RAM Database - ADD MISSING TABLES AND DATA ONLY
-- ============================================================================
-- This script only adds what's missing in your existing database
-- It won't try to modify existing tables
-- ============================================================================

SET CLIENT_ENCODING TO 'UTF8';

-- ============================================================================
-- STEP 1: Create Custom Types (if not exist)
-- ============================================================================

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_enum') THEN
        CREATE TYPE user_role_enum AS ENUM ('Admin', 'Manager', 'User');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'terms_for_enum') THEN
        CREATE TYPE terms_for_enum AS ENUM ('Domestic', 'Export', 'Both');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'audit_action_enum') THEN
        CREATE TYPE audit_action_enum AS ENUM ('INSERT', 'UPDATE', 'DELETE');
    END IF;
END $$;

-- ============================================================================
-- STEP 2: Add Missing Columns to Existing Tables (if needed)
-- ============================================================================

-- Add missing columns to countries table (if they don't exist)
DO $$
BEGIN
    -- Add country_name if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='countries' AND column_name='country_name') THEN
        ALTER TABLE countries ADD COLUMN country_name VARCHAR(100);
    END IF;
    
    -- Add country_code if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='countries' AND column_name='country_code') THEN
        ALTER TABLE countries ADD COLUMN country_code VARCHAR(10);
    END IF;
    
    -- Add is_active if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='countries' AND column_name='is_active') THEN
        ALTER TABLE countries ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    END IF;
    
    -- Add created_at if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='countries' AND column_name='created_at') THEN
        ALTER TABLE countries ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;
    
    -- Add updated_at if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='countries' AND column_name='updated_at') THEN
        ALTER TABLE countries ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- Add missing columns to states table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='states' AND column_name='state_name') THEN
        ALTER TABLE states ADD COLUMN state_name VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='states' AND column_name='state_code') THEN
        ALTER TABLE states ADD COLUMN state_code VARCHAR(10);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='states' AND column_name='is_active') THEN
        ALTER TABLE states ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='states' AND column_name='created_at') THEN
        ALTER TABLE states ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='states' AND column_name='updated_at') THEN
        ALTER TABLE states ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- Add missing columns to cities table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='cities' AND column_name='city_name') THEN
        ALTER TABLE cities ADD COLUMN city_name VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='cities' AND column_name='is_active') THEN
        ALTER TABLE cities ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='cities' AND column_name='created_at') THEN
        ALTER TABLE cities ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='cities' AND column_name='updated_at') THEN
        ALTER TABLE cities ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- ============================================================================
-- STEP 3: Create Missing Tables
-- ============================================================================

-- SUPPLIER TYPE TABLE
CREATE TABLE IF NOT EXISTS supplier_type (
    supplier_type_id SERIAL PRIMARY KEY,
    supplier_type_name VARCHAR(100) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- VENDOR GROUP SUPPLIER TYPE MAPPING
CREATE TABLE IF NOT EXISTS vendor_group_supplier_type (
    mapping_id SERIAL PRIMARY KEY,
    vendor_group_id INTEGER NOT NULL,
    supplier_type_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (vendor_group_id, supplier_type_id)
);

-- VENDOR PREFIX TABLE
CREATE TABLE IF NOT EXISTS vendor_prefix (
    vendor_prefix_id SERIAL PRIMARY KEY,
    prefix_code VARCHAR(20) NOT NULL UNIQUE,
    description VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- DEPARTMENT TABLE
CREATE TABLE IF NOT EXISTS department (
    department_id SERIAL PRIMARY KEY,
    department_name VARCHAR(100) NOT NULL UNIQUE,
    department_code VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- RATE MASTER TABLE (for yarn counts)
CREATE TABLE IF NOT EXISTS rate_master (
    rate_id SERIAL PRIMARY KEY,
    count_name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- YARN ADJUST ENTRY TABLE
CREATE TABLE IF NOT EXISTS yarn_adjust_entry (
    adjust_entry_id SERIAL PRIMARY KEY,
    stock_issue_departments_id INTEGER NOT NULL UNIQUE,
    count_id INTEGER NOT NULL,
    vendor_id INTEGER,
    department_id INTEGER NOT NULL,
    quantity NUMERIC(15,3) DEFAULT 0.000,
    adjust_date DATE,
    remarks TEXT,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- YARN ADJUST STOCK TYPE MAPPING
CREATE TABLE IF NOT EXISTS yarn_adjust_stock_type (
    mapping_id SERIAL PRIMARY KEY,
    adjust_entry_id INTEGER NOT NULL,
    stock_type_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (adjust_entry_id, stock_type_id)
);

-- FINANCIAL YEAR TABLE
CREATE TABLE IF NOT EXISTS financial_year (
    financial_year_id SERIAL PRIMARY KEY,
    year_name VARCHAR(20) NOT NULL UNIQUE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_current BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- COMPANY TABLE
CREATE TABLE IF NOT EXISTS company (
    company_id SERIAL PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    company_code VARCHAR(50) UNIQUE,
    address TEXT,
    city_id INTEGER,
    state_id INTEGER,
    country_id INTEGER,
    pincode VARCHAR(10),
    gst_number VARCHAR(20),
    pan_number VARCHAR(20),
    contact_number VARCHAR(20),
    email VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ACCESS CONTROL TABLE
CREATE TABLE IF NOT EXISTS access_control (
    access_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    module_name VARCHAR(100) NOT NULL,
    can_add BOOLEAN DEFAULT FALSE,
    can_edit BOOLEAN DEFAULT FALSE,
    can_delete BOOLEAN DEFAULT FALSE,
    can_view BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, module_name)
);

-- ============================================================================
-- STEP 4: Create Indexes (if not exist)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_supplier_type_name ON supplier_type(supplier_type_name);
CREATE INDEX IF NOT EXISTS idx_vendor_prefix_code ON vendor_prefix(prefix_code);
CREATE INDEX IF NOT EXISTS idx_department_name ON department(department_name);
CREATE INDEX IF NOT EXISTS idx_rate_master_name ON rate_master(count_name);
CREATE INDEX IF NOT EXISTS idx_yarn_adjust_date ON yarn_adjust_entry(adjust_date);
CREATE INDEX IF NOT EXISTS idx_yarn_stock_issue_departments_id ON yarn_adjust_entry(stock_issue_departments_id);
CREATE INDEX IF NOT EXISTS idx_financial_year_start_date ON financial_year(start_date);
CREATE INDEX IF NOT EXISTS idx_financial_year_is_current ON financial_year(is_current);
CREATE INDEX IF NOT EXISTS idx_company_code ON company(company_code);

-- ============================================================================
-- STEP 5: Insert Sample Data (skip duplicates)
-- ============================================================================

-- Sample data for Supplier Type
INSERT INTO supplier_type (supplier_type_id, supplier_type_name, is_active) VALUES
(1, 'Yarn Supplier', TRUE),
(2, 'Fabric Supplier', TRUE),
(3, 'Chemical Supplier', TRUE),
(4, 'Dye Supplier', TRUE),
(5, 'Service Provider', TRUE)
ON CONFLICT (supplier_type_name) DO NOTHING;

-- Sample data for Vendor Prefix
INSERT INTO vendor_prefix (vendor_prefix_id, prefix_code, description, is_active) VALUES
(1, 'V001', 'Standard Vendor Prefix', TRUE),
(2, 'V002', 'Premium Vendor Prefix', TRUE)
ON CONFLICT (prefix_code) DO NOTHING;

-- Sample data for Department
INSERT INTO department (department_id, department_name, department_code, is_active) VALUES
(1, 'AIRJET FABRIC', 'AF', TRUE),
(2, 'RTW YARN', 'RTW', TRUE),
(3, 'SHIVSHAKTI SIZING', 'SSS', TRUE)
ON CONFLICT (department_name) DO NOTHING;

-- Sample data for Rate Master (yarn counts)
INSERT INTO rate_master (rate_id, count_name, is_active) VALUES
(1, '80 DEN', TRUE),
(2, '62C', TRUE),
(3, '40PV', TRUE),
(4, '61CPT', TRUE),
(5, '32CTN', TRUE),
(6, '51CPT', TRUE),
(7, '2/76 PSF', TRUE),
(8, '10 SLB', TRUE),
(9, '41 CPT', TRUE),
(10, '80/300', TRUE),
(11, '42PV', TRUE),
(12, '40 TNC', TRUE),
(13, '51 LYC', TRUE)
ON CONFLICT (count_name) DO NOTHING;

-- Sample financial year data
INSERT INTO financial_year (financial_year_id, year_name, start_date, end_date, is_active, is_current) VALUES
(1, '2024-2025', '2024-04-01', '2025-03-31', TRUE, FALSE),
(2, '2025-2026', '2025-04-01', '2026-03-31', TRUE, TRUE)
ON CONFLICT (year_name) DO NOTHING;

-- Sample company data
INSERT INTO company (company_id, company_name, company_code, is_active) VALUES
(1, 'iTex RAM Textile Company', 'ITEX001', TRUE)
ON CONFLICT (company_code) DO NOTHING;

-- Sample admin user (only if users table exists and has username column)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') AND
       EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='username') THEN
        INSERT INTO users (user_id, username, password, full_name, email, role, is_active) VALUES
        (1, 'admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'System Administrator', 'admin@itexram.com', 'Admin', TRUE)
        ON CONFLICT (username) DO NOTHING;
    END IF;
END $$;

-- Sample access control data for admin
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        INSERT INTO access_control (user_id, module_name, can_add, can_edit, can_delete, can_view) VALUES
        (1, 'vendor_master', TRUE, TRUE, TRUE, TRUE),
        (1, 'transportation', TRUE, TRUE, TRUE, TRUE),
        (1, 'terms_condition', TRUE, TRUE, TRUE, TRUE),
        (1, 'yarn_adjust', TRUE, TRUE, TRUE, TRUE),
        (1, 'vendor_group', TRUE, TRUE, TRUE, TRUE),
        (1, 'vendor_prefix', TRUE, TRUE, TRUE, TRUE)
        ON CONFLICT (user_id, module_name) DO NOTHING;
    END IF;
END $$;

-- ============================================================================
-- STEP 6: Create/Update Triggers
-- ============================================================================

-- Function for updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to tables that have updated_at column
DO $$
DECLARE
    t text;
    trigger_exists boolean;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.columns 
        WHERE column_name = 'updated_at' 
        AND table_schema = 'public'
    LOOP
        SELECT EXISTS (
            SELECT 1 FROM pg_trigger 
            WHERE tgname = 'update_' || t || '_updated_at'
        ) INTO trigger_exists;
        
        IF NOT trigger_exists THEN
            EXECUTE format('CREATE TRIGGER update_%I_updated_at 
                           BEFORE UPDATE ON %I 
                           FOR EACH ROW 
                           EXECUTE FUNCTION update_updated_at_column()', t, t);
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 7: Create/Update Views
-- ============================================================================

-- Note: Views will use whatever column names exist in your tables
-- You may need to adjust these based on your actual column names

CREATE OR REPLACE VIEW v_transportation_list AS
SELECT 
    t.transportation_id,
    t.transportation_name,
    t.contact_number,
    t.address,
    t.gst_number,
    t.remark,
    CASE WHEN t.is_active THEN 'Active' ELSE 'Inactive' END as status
FROM transportation t
ORDER BY t.transportation_name;

-- ============================================================================
-- STEP 8: Display Summary
-- ============================================================================

SELECT 'Migration completed successfully!' as status;
SELECT COUNT(*) as total_tables 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

SELECT COUNT(*) as total_views 
FROM information_schema.views 
WHERE table_schema = 'public';

-- ============================================================================
-- IMPORTANT NOTES
-- ============================================================================
-- 
-- This script:
-- 1. Only adds missing columns to existing tables
-- 2. Only creates tables that don't exist
-- 3. Won't modify your existing data
-- 4. Safe to run multiple times
--
-- If you get errors about specific columns, it means your table
-- has different column names. Please share:
--   SELECT * FROM information_schema.columns 
--   WHERE table_name = 'countries';
--
-- And I'll adjust the script to match your exact structure.
--
-- ============================================================================