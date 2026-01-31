-- ============================================
-- Vendor Group Master Table (Parent)
-- Stores vendor categories/groups
-- ============================================

DROP TABLE IF EXISTS vendors CASCADE;
DROP TABLE IF EXISTS vendor_groups CASCADE;

CREATE TABLE vendor_groups (
    id SERIAL PRIMARY KEY,
    group_name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER
);

-- Indexes
CREATE INDEX idx_vendor_groups_name ON vendor_groups(group_name);
CREATE INDEX idx_vendor_groups_active ON vendor_groups(is_active);

-- Pre-populated Vendor Groups (23 records)
INSERT INTO vendor_groups (group_name, is_active) VALUES
('RAMRATAN TECHNO WEAVE', TRUE),
('DOMESTIC BUYER', TRUE),
('DOMESTIC FABRICS SUPPLIERS', TRUE),
('DOMESTIC SIZING', TRUE),
('DOMESTIC YARN SUPPLIER', TRUE),
('DOMESTIC JOB WEAVER', TRUE),
('AMIT BAKLIWAL', TRUE),
('SHIV SHAKTI SIZING', TRUE),
('JAKBRILLO SIZING', TRUE),
('VELV FINE POLYTEX', TRUE),
('JAINCO', TRUE),
('MADHAV AGENCIES', TRUE),
('KRISHNA YARN AGENCY', TRUE),
('NAVDURGA YARNS LLP', TRUE),
('ARVIND IMPEX', TRUE),
('MAHESHWARY CORPORATION', TRUE),
('VISHNU TEXTILE CORPORATION', TRUE),
('GLORIOUS SALES LLP', TRUE),
('SHRI LAXMI NARSINH TEXTILE', TRUE),
('KRISHNA VERALA MAG . SAH .SOOT GIRNI LTD', TRUE),
('SURYALAXMI TEXFAB PRIVATE LIMITED', TRUE),
('VINEET COTEX PVT LTD', TRUE),
('SHREE HARI YARNS PVT LTD', TRUE);

-- ============================================
-- Vendor Master Table (Child)
-- Stores vendor/supplier information with reference to vendor groups
-- ============================================

CREATE TABLE vendors (
    id SERIAL PRIMARY KEY,
    vendor_code VARCHAR(50),
    vendor_name VARCHAR(255) NOT NULL,
    vendor_group_id INTEGER REFERENCES vendor_groups(id) ON DELETE SET NULL,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    country VARCHAR(100) DEFAULT 'INDIA',
    gst_number VARCHAR(20),
    pan_number VARCHAR(20),
    contact_person VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    bank_name VARCHAR(255),
    bank_account_no VARCHAR(50),
    bank_ifsc VARCHAR(20),
    bank_branch VARCHAR(255),
    credit_days INTEGER DEFAULT 0,
    credit_limit DECIMAL(15,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER
);

-- Indexes
CREATE INDEX idx_vendors_name ON vendors(vendor_name);
CREATE INDEX idx_vendors_group ON vendors(vendor_group_id);
CREATE INDEX idx_vendors_gst ON vendors(gst_number);
CREATE INDEX idx_vendors_code ON vendors(vendor_code);
CREATE INDEX idx_vendors_active ON vendors(is_active);
