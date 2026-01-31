-- =============================================
-- MASTER DATA TABLES WITH EXISTING DATA
-- RTWE ERP SYSTEM
-- Tables: agents, consignees
-- =============================================

-- =============================================
-- 1. AGENTS TABLE
-- =============================================
DROP TABLE IF EXISTS agents CASCADE;

CREATE TABLE agents (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    country VARCHAR(100) DEFAULT 'INDIA',
    primary_contact VARCHAR(20),
    secondary_contact VARCHAR(20),
    address TEXT,
    pin_code VARCHAR(10),
    agent_percent DECIMAL(5,2) DEFAULT 0.00,
    agent_type VARCHAR(50) DEFAULT 'COMMISSION',
    account_group VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for agents
CREATE INDEX idx_agents_name ON agents(name);
CREATE INDEX idx_agents_active ON agents(is_active);
CREATE INDEX idx_agents_type ON agents(agent_type);

-- INSERT EXISTING AGENT DATA (12 records from iTexRAM)
INSERT INTO agents (name, country, agent_percent, agent_type, is_active) VALUES
('N KEWAL TEXTILE AGENCY', 'INDIA', 1.0, 'COMMISSION', true),
('GIRISHKUMAR A SHARMA', 'INDIA', 1.0, 'COMMISSION', true),
('DEVKISHAN SARDA', 'INDIA', 1.0, 'COMMISSION', true),
('SANDIP MUNDRA', 'INDIA', 1.0, 'COMMISSION', true),
('SAMRENDRA GHANOTRA', 'INDIA', 1.0, 'COMMISSION', true),
('SELF', 'INDIA', 0.0, 'COMMISSION', true),
('RAJESH AGIWAL', 'INDIA', 0.0, 'COMMISSION', true),
('NATHMAL TOTALA', 'INDIA', 0.0, 'COMMISSION', true),
('KUSHALCHAND R VYAS', 'INDIA', 1.0, 'COMMISSION', true),
('LALIT MALI', 'INDIA', 1.0, 'COMMISSION', true),
('MADANGOPAL S DAMANI', 'INDIA', 1.0, 'COMMISSION', true),
('SURENDRA S DAMANI', 'INDIA', 1.0, 'COMMISSION', true);

-- =============================================
-- 2. CONSIGNEES TABLE
-- =============================================
DROP TABLE IF EXISTS consignees CASCADE;

CREATE TABLE consignees (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    state VARCHAR(100),
    city VARCHAR(100),
    gstn VARCHAR(20),
    address TEXT,
    pin_code VARCHAR(10),
    contact_no VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for consignees
CREATE INDEX idx_consignees_name ON consignees(name);
CREATE INDEX idx_consignees_gstn ON consignees(gstn);
CREATE INDEX idx_consignees_active ON consignees(is_active);

-- INSERT EXISTING CONSIGNEE DATA (25 records from iTexRAM - Page 1)
INSERT INTO consignees (name, state, city, gstn, is_active) VALUES
('MR. MANGALAM INDUSTRIES', 'MAHARASHTRA', 'BHIWANDI', '27ABNFM7575N1Z8', true),
('M SANCHIT LEE TRENZ', 'MAHARASHTRA', 'MUMBAI', '27ACCFM4532H1ZB', true),
('N MARGI TEXTILES AGENCY', 'MAHARASHTRA', 'MUMBAI', '27AAIFN5005E1ZK', true),
('SWADESH LIFESTYLE LLP', 'MAHARASHTRA', 'MUMBAI', '', true),
('INDIAN TEXTILS DRS', 'MAHARASHTRA', 'ICHALKARANJI', '27AABHM2331M1Z8', true),
('MOHATUL SILK INDUSTRIES', 'MAHARASHTRA', 'MUMBAI', '27CNUPS2316G1ZL', true),
('SHRI MAHAGANPATI ROADLINES', 'MAHARASHTRA', 'ICHALKARANJI', '27BAYPG9791D2ZX', true),
('VISHNU DYEING & PRINTING WORKS', 'MAHARASHTRA', 'MUMBAI', '27AAAFV0866F1Z7', true),
('JOY POLYFAB LLP', 'GUJRAT', 'VAPI', '24AAVFJ6211B1ZL', true),
('PARAMOUNT TEXFAB PVT LTD', 'MAHARASHTRA', 'BHIWANDI', '27AADCS8675D1Z2', true),
('RUNGTA SIZING WORKS & PROCESS', 'MAHARASHTRA', 'BHIWANDI', '27AABFR5112M1Z6', true),
('ARIHANT EXIM (SANJAY BHAI)', 'MAHARASHTRA', 'MUMBAI', '27AEJPM8975P1ZB', true),
('REGALIA FABRICS INTERNATIONAL LLP', 'MAHARASHTRA', 'MUMBAI', '27AAXFR2657P1Z2', true),
('SHIVAM ENTERPRISES', 'MAHARASHTRA', 'MUMBAI', '27CKIPS0942R1ZC', true),
('MAAN TEXTILE INDUSTRIES', 'MAHARASHTRA', 'MUMBAI', '27AADPS2312L1ZO', true),
('RAMRATAN WEAVINGS JOB', 'MAHARASHTRA', 'ICHALKARANJI', '27ABEFR8289B1ZW', true),
('PRERNA TEXTILES', 'MAHARASHTRA', 'ICHALKARANJI', '24AJQPS5356N1Z6', true),
('BID INDUSTRIES', 'MAHARASHTRA', 'MUMBAI', '27AAVFB9344B1Z7', true),
('R B AGENCIES', 'MAHARASHTRA', 'MUMBAI', '27AFUPK6191F1ZX', true),
('LAHOTI TEXTILES PRIVATE LIMITED', 'MAHARASHTRA', 'ICHALKARANJI', '27AABCL2269E2ZM', true),
('SOURABH RAYON', 'MAHARASHTRA', 'MUMBAI', '27AFAPJ6495B1ZJ', true),
('BTM IMPEX', 'MAHARASHTRA', 'BHIWANDI', '27ABDFB0551F1ZW', true),
('SHRIPAL TRADING CO', 'MAHARASHTRA', 'MUMBAI', '27AAAHI2732P1Z2', true),
('CHUR TEXTILES LTD (SARAVALI MIDC)', 'MAHARASHTRA', 'THANE', '27AAACC9450D1ZU', true),
('K K P FASHIONS PVT LTD', 'MAHARASHTRA', 'PALGHAR', '27AAJCK3805H1ZI', true);

-- =============================================
-- 3. GODOWN LOCATIONS TABLE
-- =============================================
DROP TABLE IF EXISTS godown_locations CASCADE;

CREATE TABLE godown_locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,              -- Godown Location*
    description TEXT,                        -- Description
    location VARCHAR(100),                   -- Location (city/area)
    location_code VARCHAR(50),               -- Location Code
    vendor_group VARCHAR(100),               -- Vendor Group
    location_type VARCHAR(50),               -- Location Type (YARN/FABRIC/WAREHOUSE/SIZING/WARPING)
    is_active BOOLEAN DEFAULT true,          -- Is Active (checkbox)
    is_default BOOLEAN DEFAULT false,        -- Is Default (checkbox)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for godown_locations
CREATE INDEX idx_godown_name ON godown_locations(name);
CREATE INDEX idx_godown_active ON godown_locations(is_active);
CREATE INDEX idx_godown_type ON godown_locations(location_type);

-- NOTE: Existing godown data from iTexRAM (18 records):
-- Fetch via API from server, DO NOT insert here as per user request
-- Data includes: MUDGAL SIZING INDUSTRIES, CHARBHUJA SIZERS, KHARAD LOCATION,
-- USHA ANAND SIZING, TOTALA WARPING, K K WARPERS, RTW TRADING FABRIC GODOWN,
-- MAHADEV SIZING, JAKBRILLO SIZING, SHIVSHAKTI SIZING, VIKRANT FABRIC,
-- VIKRANT YARN, RTW FABRIC, RTW YARN, RAPPIER FABRIC, RAPPIER YARN,
-- AIRJET FABRIC, AIRJET YARN

-- =============================================
-- VERIFICATION QUERIES
-- =============================================
-- Run these after creating tables to verify data:
-- SELECT COUNT(*) as agent_count FROM agents;
-- SELECT COUNT(*) as consignee_count FROM consignees;
-- SELECT COUNT(*) as godown_count FROM godown_locations;
-- SELECT * FROM agents ORDER BY name;
-- SELECT * FROM consignees ORDER BY name;
-- SELECT * FROM godown_locations ORDER BY name;
