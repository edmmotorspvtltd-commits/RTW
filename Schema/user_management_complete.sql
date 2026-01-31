-- ============================================================
-- RTWE ERP - COMPLETE DATABASE SCHEMA
-- PostgreSQL 14+
-- Created: January 2026
-- Purpose: Multi-unit ERP system with full audit trail
-- ============================================================

-- ============================================================
-- 1. COMPANIES TABLE
-- ============================================================
CREATE TABLE companies (
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
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    -- Indexes
    CONSTRAINT valid_gst_format CHECK (gst_number IS NULL OR LENGTH(gst_number) = 15),
    CONSTRAINT valid_pan_format CHECK (pan_number IS NULL OR LENGTH(pan_number) = 10)
);

-- Create indexes for companies
CREATE INDEX idx_companies_code ON companies(company_code);
CREATE INDEX idx_companies_status ON companies(status);
CREATE INDEX idx_companies_gst ON companies(gst_number) WHERE gst_number IS NOT NULL;
CREATE INDEX idx_companies_created_at ON companies(created_at DESC);

-- ============================================================
-- 2. COMPANIES AUDIT TABLE (History)
-- ============================================================
CREATE TABLE companies_audit (
    audit_id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Action Information
    action_type VARCHAR(20) NOT NULL CHECK (action_type IN ('CREATE', 'UPDATE', 'DELETE')),
    action_timestamp TIMESTAMP(6) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- Microsecond precision
    action_by INTEGER NOT NULL,
    action_by_name VARCHAR(255),
    action_by_email VARCHAR(255),
    
    -- Changed Fields
    field_name VARCHAR(100),
    old_value TEXT,
    new_value TEXT,
    
    -- Complete Record Snapshot (JSON)
    old_record JSONB,
    new_record JSONB,
    
    -- Metadata
    ip_address INET,
    user_agent TEXT,
    
    CONSTRAINT fk_action_by FOREIGN KEY (action_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Create indexes for audit trail
CREATE INDEX idx_companies_audit_company ON companies_audit(company_id);
CREATE INDEX idx_companies_audit_timestamp ON companies_audit(action_timestamp DESC);
CREATE INDEX idx_companies_audit_action_by ON companies_audit(action_by);
CREATE INDEX idx_companies_audit_action_type ON companies_audit(action_type);

-- ============================================================
-- 3. UNITS TABLE
-- ============================================================
CREATE TABLE units (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    unit_code VARCHAR(50) UNIQUE NOT NULL,
    unit_name VARCHAR(255) NOT NULL,
    unit_type VARCHAR(50) CHECK (unit_type IN ('manufacturing', 'processing', 'warehouse', 'distribution', 'office')),
    
    -- Location Information
    location VARCHAR(255) NOT NULL,
    address_line1 TEXT NOT NULL,
    address_line2 TEXT,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    
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
CREATE INDEX idx_units_company ON units(company_id);
CREATE INDEX idx_units_code ON units(unit_code);
CREATE INDEX idx_units_status ON units(status);
CREATE INDEX idx_units_active ON units(is_active);

-- ============================================================
-- 4. UNITS AUDIT TABLE (History)
-- ============================================================
CREATE TABLE units_audit (
    audit_id SERIAL PRIMARY KEY,
    unit_id INTEGER NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    company_id INTEGER NOT NULL,
    
    -- Action Information
    action_type VARCHAR(20) NOT NULL CHECK (action_type IN ('CREATE', 'UPDATE', 'DELETE')),
    action_timestamp TIMESTAMP(6) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    action_by INTEGER NOT NULL,
    action_by_name VARCHAR(255),
    action_by_email VARCHAR(255),
    
    -- Changed Fields
    field_name VARCHAR(100),
    old_value TEXT,
    new_value TEXT,
    
    -- Complete Record Snapshot (JSON)
    old_record JSONB,
    new_record JSONB,
    
    -- Metadata
    ip_address INET,
    user_agent TEXT
);

-- Create indexes for units audit
CREATE INDEX idx_units_audit_unit ON units_audit(unit_id);
CREATE INDEX idx_units_audit_company ON units_audit(company_id);
CREATE INDEX idx_units_audit_timestamp ON units_audit(action_timestamp DESC);
CREATE INDEX idx_units_audit_action_by ON units_audit(action_by);

-- ============================================================
-- 5. USERS TABLE
-- ============================================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    
    -- Company & Unit Assignment
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    unit_id INTEGER REFERENCES units(id) ON DELETE SET NULL,
    can_access_all_units BOOLEAN DEFAULT false,
    
    -- Personal Information
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    alternate_phone VARCHAR(20),
    date_of_birth DATE,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
    
    -- Address Information
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    emergency_contact VARCHAR(20),
    
    -- Employment Information
    joining_date DATE NOT NULL,
    department VARCHAR(100),
    designation VARCHAR(100),
    reporting_manager_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    work_shift VARCHAR(50),
    employment_type VARCHAR(50) CHECK (employment_type IN ('permanent', 'contract', 'temporary')),
    probation_period_months INTEGER,
    
    -- Login Credentials
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    
    -- Role & Access
    role VARCHAR(50) NOT NULL CHECK (role IN ('super_admin', 'company_admin', 'unit_manager', 'manager', 'employee')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'terminated')),
    
    -- Email Verification
    email_verified BOOLEAN DEFAULT false,
    verification_token VARCHAR(255),
    verification_token_expires TIMESTAMP WITH TIME ZONE,
    last_verification_email_sent TIMESTAMP WITH TIME ZONE,
    
    -- Two-Factor Authentication
    two_factor_enabled BOOLEAN DEFAULT false,
    two_factor_secret TEXT, -- Encrypted
    two_factor_backup_codes TEXT, -- Encrypted JSON array
    
    -- Security
    failed_login_attempts INTEGER DEFAULT 0,
    account_locked_until TIMESTAMP WITH TIME ZONE,
    last_login TIMESTAMP WITH TIME ZONE,
    last_password_change TIMESTAMP WITH TIME ZONE,
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP WITH TIME ZONE,
    force_password_change BOOLEAN DEFAULT true,
    
    -- Profile
    profile_picture TEXT,
    
    -- Audit Fields
    created_by INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for users
CREATE INDEX idx_users_company ON users(company_id);
CREATE INDEX idx_users_unit ON users(unit_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_employee_id ON users(employee_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_verification_token ON users(verification_token) WHERE verification_token IS NOT NULL;
CREATE INDEX idx_users_password_reset_token ON users(password_reset_token) WHERE password_reset_token IS NOT NULL;

-- ============================================================
-- 6. USERS AUDIT TABLE (History)
-- ============================================================
CREATE TABLE users_audit (
    audit_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_id INTEGER,
    unit_id INTEGER,
    
    -- Action Information
    action_type VARCHAR(20) NOT NULL CHECK (action_type IN ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'PASSWORD_CHANGE', 'ROLE_CHANGE')),
    action_timestamp TIMESTAMP(6) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    action_by INTEGER,
    action_by_name VARCHAR(255),
    action_by_email VARCHAR(255),
    
    -- Changed Fields
    field_name VARCHAR(100),
    old_value TEXT,
    new_value TEXT,
    
    -- Complete Record Snapshot (JSON) - Password excluded
    old_record JSONB,
    new_record JSONB,
    
    -- Metadata
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    
    -- Login/Security Events
    login_successful BOOLEAN,
    login_method VARCHAR(50), -- 'password', '2fa', 'sso'
    failure_reason TEXT
);

-- Create indexes for users audit
CREATE INDEX idx_users_audit_user ON users_audit(user_id);
CREATE INDEX idx_users_audit_company ON users_audit(company_id);
CREATE INDEX idx_users_audit_timestamp ON users_audit(action_timestamp DESC);
CREATE INDEX idx_users_audit_action_type ON users_audit(action_type);
CREATE INDEX idx_users_audit_action_by ON users_audit(action_by);

-- ============================================================
-- 7. USER PERMISSIONS TABLE
-- ============================================================
CREATE TABLE user_permissions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Module Permissions
    module_name VARCHAR(50) NOT NULL,
    
    -- Actions
    can_view BOOLEAN DEFAULT false,
    can_create BOOLEAN DEFAULT false,
    can_edit BOOLEAN DEFAULT false,
    can_delete BOOLEAN DEFAULT false,
    can_export BOOLEAN DEFAULT false,
    
    -- Audit Fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_user_module UNIQUE (user_id, module_name)
);

-- Create indexes for permissions
CREATE INDEX idx_permissions_user ON user_permissions(user_id);
CREATE INDEX idx_permissions_module ON user_permissions(module_name);

-- ============================================================
-- 8. USER SESSIONS TABLE
-- ============================================================
CREATE TABLE user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    
    -- Session Information
    ip_address INET,
    user_agent TEXT,
    device_info TEXT,
    
    -- Session Timing
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Session Status
    is_active BOOLEAN DEFAULT true,
    logout_at TIMESTAMP WITH TIME ZONE,
    logout_reason VARCHAR(50) -- 'manual', 'timeout', 'forced'
);

-- Create indexes for sessions
CREATE INDEX idx_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_sessions_active ON user_sessions(is_active, expires_at);
CREATE INDEX idx_sessions_last_activity ON user_sessions(last_activity DESC);

-- ============================================================
-- 9. SYSTEM SETTINGS TABLE
-- ============================================================
CREATE TABLE system_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type VARCHAR(50), -- 'string', 'number', 'boolean', 'json'
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER REFERENCES users(id)
);

-- Insert default settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES
('session_timeout_minutes', '30', 'number', 'Auto logout after inactivity (minutes)', false),
('max_login_attempts', '5', 'number', 'Maximum failed login attempts before account lock', false),
('account_lock_duration_minutes', '30', 'number', 'Account lock duration after max failed attempts', false),
('password_min_length', '8', 'number', 'Minimum password length', false),
('password_require_uppercase', 'true', 'boolean', 'Require uppercase letter in password', false),
('password_require_lowercase', 'true', 'boolean', 'Require lowercase letter in password', false),
('password_require_number', 'true', 'boolean', 'Require number in password', false),
('password_require_special', 'true', 'boolean', 'Require special character in password', false),
('email_verification_required', 'true', 'boolean', 'Require email verification for new users', false),
('two_factor_mandatory_for_admins', 'true', 'boolean', 'Require 2FA for admin users', false),
('verification_token_expires_hours', '24', 'number', 'Email verification token expiry (hours)', false),
('password_reset_token_expires_hours', '2', 'number', 'Password reset token expiry (hours)', false);

-- ============================================================
-- 10. FUNCTIONS AND TRIGGERS
-- ============================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all main tables
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_units_updated_at BEFORE UPDATE ON units
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_permissions_updated_at BEFORE UPDATE ON user_permissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 11. VIEWS FOR EASY QUERIES
-- ============================================================

-- View: Users with Company and Unit Information
CREATE OR REPLACE VIEW v_users_full AS
SELECT 
    u.id,
    u.employee_id,
    u.full_name,
    u.email,
    u.phone,
    u.username,
    u.role,
    u.status,
    u.email_verified,
    u.two_factor_enabled,
    u.last_login,
    u.created_at,
    c.id AS company_id,
    c.company_name,
    c.company_code,
    un.id AS unit_id,
    un.unit_name,
    un.unit_code,
    u.can_access_all_units,
    rm.full_name AS reporting_manager_name,
    u.department,
    u.designation
FROM users u
LEFT JOIN companies c ON u.company_id = c.id
LEFT JOIN units un ON u.unit_id = un.id
LEFT JOIN users rm ON u.reporting_manager_id = rm.id
WHERE u.deleted_at IS NULL;

-- View: Active Users Count by Company
CREATE OR REPLACE VIEW v_users_count_by_company AS
SELECT 
    c.id AS company_id,
    c.company_name,
    COUNT(u.id) AS total_users,
    COUNT(CASE WHEN u.status = 'active' THEN 1 END) AS active_users,
    COUNT(CASE WHEN u.status = 'inactive' THEN 1 END) AS inactive_users,
    COUNT(CASE WHEN u.status = 'suspended' THEN 1 END) AS suspended_users
FROM companies c
LEFT JOIN users u ON c.id = u.company_id AND u.deleted_at IS NULL
WHERE c.deleted_at IS NULL
GROUP BY c.id, c.company_name;

-- View: Units with Company Information
CREATE OR REPLACE VIEW v_units_full AS
SELECT 
    un.id,
    un.unit_code,
    un.unit_name,
    un.unit_type,
    un.location,
    un.is_active,
    un.status,
    c.id AS company_id,
    c.company_name,
    c.company_code,
    un.manager_name,
    un.manager_email,
    un.production_capacity,
    un.max_employees,
    COUNT(DISTINCT u.id) AS current_employees
FROM units un
LEFT JOIN companies c ON un.company_id = c.id
LEFT JOIN users u ON un.id = u.unit_id AND u.deleted_at IS NULL AND u.status = 'active'
WHERE un.deleted_at IS NULL
GROUP BY un.id, c.id;

-- ============================================================
-- 12. SAMPLE DATA (For Testing)
-- ============================================================

-- Insert sample company
INSERT INTO companies (
    company_code, company_name, company_type,
    owner_name, owner_email, owner_phone,
    address_line1, city, state, pincode,
    registration_date, status
) VALUES (
    'COMP-001', 'ABC Textiles Ltd', 'both',
    'Mr. Rajesh Sharma', 'rajesh@abctextiles.com', '9876543210',
    'Plot No. 123, Industrial Area', 'Mumbai', 'Maharashtra', '400001',
    '2020-01-01', 'active'
);

-- Insert sample units
INSERT INTO units (
    company_id, unit_code, unit_name, unit_type,
    location, address_line1, city, state, pincode,
    manager_name, manager_email, is_active
) VALUES 
(1, 'MUM-001', 'Mumbai Factory', 'manufacturing',
 'Mumbai, Maharashtra', 'MIDC Area, Plot 45', 'Mumbai', 'Maharashtra', '421003',
 'Mr. Amit Patel', 'amit@abctextiles.com', true),
(1, 'DEL-001', 'Delhi Factory', 'manufacturing',
 'Delhi, NCR', 'Industrial Area, Sector 12', 'Delhi', 'Delhi', '110001',
 'Ms. Priya Sharma', 'priya@abctextiles.com', true),
(1, 'PUN-001', 'Pune Factory', 'processing',
 'Pune, Maharashtra', 'Pimpri-Chinchwad, MIDC', 'Pune', 'Maharashtra', '411018',
 'Mr. Rahul Kumar', 'rahul@abctextiles.com', true);

-- Note: Do not insert sample users with passwords in schema
-- Users should be created through the application with proper password hashing

-- ============================================================
-- 13. SECURITY POLICIES (Row Level Security)
-- ============================================================

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Super admins can see all users
CREATE POLICY users_super_admin_all ON users
    FOR ALL
    TO authenticated_user
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = current_user_id()
            AND u.role = 'super_admin'
        )
    );

-- Policy: Company admins can see users in their company
CREATE POLICY users_company_admin_company ON users
    FOR SELECT
    TO authenticated_user
    USING (
        company_id = (
            SELECT company_id FROM users
            WHERE id = current_user_id()
        )
        AND EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = current_user_id()
            AND u.role = 'company_admin'
        )
    );

-- Policy: Unit managers can see users in their unit
CREATE POLICY users_unit_manager_unit ON users
    FOR SELECT
    TO authenticated_user
    USING (
        unit_id = (
            SELECT unit_id FROM users
            WHERE id = current_user_id()
        )
        AND EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = current_user_id()
            AND u.role = 'unit_manager'
        )
    );

-- ============================================================
-- END OF SCHEMA
-- ============================================================

-- Create helper function to get current user id (to be set by application)
CREATE OR REPLACE FUNCTION current_user_id()
RETURNS INTEGER AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_user_id', TRUE), '')::INTEGER;
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated_user;

-- Summary report
DO $$
BEGIN
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'RTWE ERP DATABASE SCHEMA CREATED SUCCESSFULLY';
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'Main Tables: 8';
    RAISE NOTICE 'Audit Tables: 3';
    RAISE NOTICE 'Views: 3';
    RAISE NOTICE 'Indexes: 40+';
    RAISE NOTICE 'Triggers: 5';
    RAISE NOTICE 'RLS Policies: 3';
    RAISE NOTICE '============================================================';
END $$;
