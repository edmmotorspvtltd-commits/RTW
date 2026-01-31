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

-- INSERT EXISTING GODOWN DATA (18 records from iTexRAM)
INSERT INTO godown_locations (name, is_active) VALUES
('MUDGAL SIZING INDUSTRIES', true),
('CHARBHUJA SIZERS', true),
('KHARAD LOCATION', true),
('USHA ANAND SIZING', true),
('TOTALA WARPING', true),
('K K WARPERS', true),
('RTW TRADING FABRIC GODOWN', false),
('MAHADEV SIZING', true),
('JAKBRILLO SIZING', true),
('SHIVSHAKTI SIZING', true),
('VIKRANT FABRIC', true),
('VIKRANT YARN', false),
('RTW FABRIC', false),
('RTW YARN', true),
('RAPPIER FABRIC', true),
('RAPPIER YARN', false),
('AIRJET FABRIC', true),
('AIRJET YARN', false);

-- =============================================
-- 4. INSURANCE COMPANIES TABLE
-- =============================================
DROP TABLE IF EXISTS insurance_companies CASCADE;

CREATE TABLE insurance_companies (
    id SERIAL PRIMARY KEY,
    company_name VARCHAR(200) NOT NULL,      -- Insurance Company Name
    policy_number VARCHAR(100),              -- Policy Number
    policy_type VARCHAR(100),                -- Policy Type
    is_active BOOLEAN DEFAULT true,          -- Is Active
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for insurance_companies
CREATE INDEX idx_insurance_name ON insurance_companies(company_name);
CREATE INDEX idx_insurance_active ON insurance_companies(is_active);

-- INSERT EXISTING INSURANCE DATA (1 record from iTexRAM)
INSERT INTO insurance_companies (company_name, policy_number, policy_type, is_active) VALUES
('THE ORIENTAL INSURANCE COMPANY LIMITED', '162602/21/2025/42', 'MARINE CARGO - OPEN POLICY', true);

-- =============================================
-- 5. DOMESTIC BUYERS TABLE (Full Schema)
-- =============================================
DROP TABLE IF EXISTS buyer_representatives CASCADE;
DROP TABLE IF EXISTS buyer_consignees CASCADE;
DROP TABLE IF EXISTS domestic_buyers CASCADE;

CREATE TABLE domestic_buyers (
    id SERIAL PRIMARY KEY,
    
    -- Basic Buyer Info
    buyer_name VARCHAR(200) NOT NULL,
    buyer_code VARCHAR(50),                   -- Buyer No (e.g., BD00170)
    gst_number VARCHAR(50),                   -- GST Number
    country VARCHAR(100) DEFAULT 'INDIA',
    state VARCHAR(100),
    city VARCHAR(100),
    address_line1 TEXT,                       -- Buyer Address 1
    address_line2 TEXT,                       -- Buyer Address 2
    address_line3 TEXT,                       -- Buyer Address 3
    pin_code VARCHAR(20),
    phone_no VARCHAR(20),                     -- Buyer Phone No
    email VARCHAR(100),                       -- Buyer Email Id
    
    -- Bank Details
    bank_name VARCHAR(200),                   -- Bank
    bank_country VARCHAR(100),                -- Bank Country
    bank_state VARCHAR(100),                  -- Bank State
    bank_state_code VARCHAR(20),              -- State Code
    bank_address TEXT,                        -- Bank Address
    bank_pincode VARCHAR(20),                 -- Bank Pincode
    bank_city VARCHAR(100),                   -- Bank City
    
    -- Financial Info
    credit_limit DECIMAL(15,2),               -- Credit Limit
    interest_percent DECIMAL(5,2),            -- Interest %
    
    -- Tax Info
    gst_reg_type VARCHAR(50),                 -- GST Reg. Type
    is_consignee_buyer BOOLEAN DEFAULT false, -- Consignee as a buyer
    account_group VARCHAR(100),               -- Account Group
    vendor_group VARCHAR(100),                -- Group (Vendor Group)
    pan_number VARCHAR(20),                   -- Pan Number
    is_tcs_applied BOOLEAN DEFAULT false,     -- Is TCS Applied
    buyer_collectee_type VARCHAR(50),         -- Buyer Collectee Type
    
    -- Business Info
    market VARCHAR(100),                      -- Market
    sector VARCHAR(100),                      -- Sector
    is_self BOOLEAN DEFAULT false,            -- Is Self
    is_insurance_applied BOOLEAN DEFAULT false, -- Is Insurance Applied
    msme_type VARCHAR(50),                    -- MSME/Non-MSME
    sales_type VARCHAR(50),                   -- Sales Type
    whatsapp_no VARCHAR(20),                  -- WhatsApp Phone No
    whatsapp_group_id VARCHAR(100),           -- WhatsApp Group ID
    
    -- Legacy/Compatibility
    representative_name VARCHAR(200),
    created_in VARCHAR(50) DEFAULT 'Trading',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for domestic_buyers
CREATE INDEX idx_buyer_name ON domestic_buyers(buyer_name);
CREATE INDEX idx_buyer_gst ON domestic_buyers(gst_number);
CREATE INDEX idx_buyer_city ON domestic_buyers(city);
CREATE INDEX idx_buyer_active ON domestic_buyers(is_active);

-- =============================================
-- 5a. BUYER CONSIGNEES TABLE (Child Table)
-- =============================================
CREATE TABLE buyer_consignees (
    id SERIAL PRIMARY KEY,
    buyer_id INTEGER NOT NULL REFERENCES domestic_buyers(id) ON DELETE CASCADE,
    name VARCHAR(200),
    country VARCHAR(100) DEFAULT 'INDIA',
    state VARCHAR(100),
    city VARCHAR(100),
    address TEXT,
    pin_code VARCHAR(20),
    phone_number VARCHAR(20),
    email VARCHAR(100),
    gstn VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_buyer_consignee_buyer ON buyer_consignees(buyer_id);

-- =============================================
-- 5b. BUYER REPRESENTATIVES TABLE (Child Table)
-- =============================================
CREATE TABLE buyer_representatives (
    id SERIAL PRIMARY KEY,
    buyer_id INTEGER NOT NULL REFERENCES domestic_buyers(id) ON DELETE CASCADE,
    representative_name VARCHAR(200),
    contact_number VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_buyer_rep_buyer ON buyer_representatives(buyer_id);

-- INSERT EXISTING DOMESTIC BUYER DATA (25 records - basic fields only)
INSERT INTO domestic_buyers (buyer_name, buyer_code, country, state, city, address_line1, pin_code, created_in, is_active) VALUES
('M SANCHIT LEE TRENZ', 'BD00170', 'INDIA', 'MAHARASHTRA', 'MUMBAI', '384 , M - BUILDING , SHOP NO 7 , GROUND FLOOR , DHABOLKARWADI KALBADEVI', '400002', 'Trading', true),
('N MARGI TEXTILES AGENCY', 'BD00169', 'INDIA', 'MAHARASHTRA', 'MUMBAI', '1301, TADMOR , SKYLINE OASIS VIDYAVIHAR , GHATKOPAR(W)', '400086', 'Trading', true),
('SWADESH LIFESTYLE LLP', 'BD00168', 'INDIA', 'MAHARASHTRA', 'MUMBAI', '384 - A , DHABOLKARWADI 2ND FLOOR , ROOM NO 15 KALBADEVI', '400002', 'Trading', true),
('MOHATUL SILK INDUSTRIES', 'BD00166', 'INDIA', 'MAHARASHTRA', 'MUMBAI', '20, PATEL BUILDING, 3RD FLOOR DADY SHETH AGARY LANE KALBADEVI ROAD', '400002', 'Trading', true),
('ARIHANT EXIM (SANJAY BHAI)', 'BD00166', 'INDIA', 'MAHARASHTRA', 'MUMBAI', 'MUMBAI MUMBAI', '400002', 'Trading', true),
('REGALIA FABRICS INTERNATIONAL LLP', 'BD00167', 'INDIA', 'MAHARASHTRA', 'MUMBAI', '802 , AJMERA MIDTOWN , NEXT TO INDIAN ART STUD POPATWADI , KALBADEVI ROAD', '400002', 'Trading', true),
('SHIVAM ENTERPRISES', 'BD00166', 'INDIA', 'MAHARASHTRA', 'MUMBAI', '25 , RAMWADI , 3RD FLOOR , ROOM NO 82 KALBADEVI ROAD , MUMBAI', '400002', 'Trading', true),
('MAAN TEXTILE INDUSTRIES', 'BD00166', 'INDIA', 'MAHARASHTRA', 'MUMBAI', '147 GAIWADI SADAN , ROOM NO 20 , GROUND FLOOR , DR VIEGAS STREET KALBADEVI ROAD', '400002', 'Trading', true),
('BID INDUSTRIES', 'BD00164', 'INDIA', 'MAHARASHTRA', 'MUMBAI', '145-C , DR VIEGAS STREET , 5TH FLOOR , ROOM NO 23 GAIWADI ,KALBADEVI', '400002', 'Trading', true),
('R B AGENCIES', 'BD00163', 'INDIA', 'MAHARASHTRA', 'MUMBAI', 'C 25 APMC MASALA MARKET , VASHI', '400703', 'Trading', true),
('SOURABH RAYON', 'BD00161', 'INDIA', 'MAHARASHTRA', 'MUMBAI', '146 , KRISHNA BHAVAN , 1ST FLOOR , R .NO 15 , DE VEIGAS STREET KALBADEVI', '400002', 'Trading', true),
('BTM IMPEX', 'BD00160', 'INDIA', 'MAHARASHTRA', 'BHIWANDI', 'GROUND FLOOR , BLDG NO 1436/46 , 47 GALA NO 46 & 47 , ANMOL TEXTILE MARKET RAHNAL , BHIWANDI', '421308', 'Trading', true),
('SHRIPAL TRADING CO', 'BD00159', 'INDIA', 'MAHARASHTRA', 'MUMBAI', '1ST FLOOR , BLDG 95/A ROOM NO 15 , DHANJI MULJI BLDG OLD HANUMAN LANE , KALBADEVI', '400002', 'Trading', true),
('K K P FASHIONS PVT LTD', 'BD00158', 'INDIA', 'MAHARASHTRA', 'PALGHAR', 'PLOT NO G /7/2/1 MIDC BOISAR TARAPUR', '401404', 'Trading', true),
('ENES TEXTILE MILLS ( B AND B )', 'BD00157', 'INDIA', 'Tamil Nadu', 'TIRUPPUR', '8/3 - C SENGUTHAPURAM 1ST STREET MANGALAM ROAD', '641604', 'Trading', true),
('AUREVIA GLOBAL CREATION LLP', 'BD00157', 'INDIA', 'MAHARASHTRA', 'MUMBAI', 'FLOOR - 3 , FLAT NO 37 , BLDG NO 20/24 PRAGJI VRINDAVAN , DHIRUBHAI PAREKH MARG LAD WADI , KALBADEVI', '400002', 'Trading', true),
('M NARESHKUMAR TEXTILES PRIVATE LIMITED', 'BD00157', 'INDIA', 'MAHARASHTRA', 'MUMBAI', 'PLOT NO 146 , OFFICE NO 9 , KRISHNA BUILDING DR VEIGAS STREET , KALBADEVI', '400002', 'Trading', true),
('SUDHIR ENTERPRISES', 'BD00153', 'INDIA', 'MAHARASHTRA', 'MUMBAI', '77 - 79 , 1ST FLOOR , VITTHALWADI KALBADEVI ROAD', '400002', 'Trading', true),
('KRISHNA CREATION', 'BD00152', 'INDIA', 'MAHARASHTRA', 'MUMBAI', '331 A BANDAMWADI 2ND FLOOR ROOM NO 61 A KALBADEVI ROAD', '400002', 'Trading', true),
('INDRAPUJA POLYCOT ( INDIA )', 'BD00151', 'INDIA', 'MAHARASHTRA', 'MUMBAI', '156 , DR VEIGAS STRET , SHOP NO C2 , GROUND FLOOR SWADESHI MARKET , KALBADEVI', '400002', 'Trading', true),
('MAMTA FASHION', 'BD00150', 'INDIA', 'GUJRAT', 'SURAT', 'A/303 DMD LOGISTICS PARK NEAR SALASAR TEXTILES MARKET SAROLI', '395010', 'Trading', true),
('WEAVE ART FABRICS', 'BD00149', 'INDIA', 'MAHARASHTRA', 'MUMBAI', '173 , ROYAL SQUARE , 5TH FLOOR , OFFICE NO 502 , DR VEIGAS STREET KALBADEVI ROAD', '400002', 'Trading', true),
('SHREE SACHIYA MA COTTON MILLS', 'BD00148', 'INDIA', 'MAHARASHTRA', 'MUMBAI', '384E , DABHOLKARWADI , OFF NO 15 , 1ST FLOOR KALBADEVI ROAD', '400002', 'Trading', true),
('B C TEXTILES', 'BD00147', 'INDIA', 'MAHARASHTRA', 'MUMBAI', 'FLAT NO 176 , GODOWN NO 2 , SAWANTWADI CLUB DR VEIGAS STREET , KALBADEVI', '400002', 'Trading', true),
('SHREE NARAYAN SILK HOUSE PVT LTD', 'BD00143', 'INDIA', 'MAHARASHTRA', 'MUMBAI', '384-J , DABHOLKAR WADI , GR FLOOR SHOP NO 84 , KALBADEVI ROAD', '400002', 'Trading', true);

-- =============================================
-- 6. PAYMENT TERMS TABLE
-- =============================================
DROP TABLE IF EXISTS payment_terms CASCADE;

CREATE TABLE payment_terms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,              -- Payment Terms Name
    description TEXT,                        -- Description
    payment_type VARCHAR(50) DEFAULT 'Domestic', -- Payment Terms For
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for payment_terms
CREATE INDEX idx_payment_name ON payment_terms(name);
CREATE INDEX idx_payment_active ON payment_terms(is_active);

-- INSERT EXISTING PAYMENT TERMS DATA (12 records from iTexRAM)
INSERT INTO payment_terms (name, description, payment_type, is_active) VALUES
('7 DAYS 4%', '7 DAYS 4%', 'Domestic', true),
('60 DAYS NETT', '60 DAYS NETT', 'Domestic', true),
('30 DAYS 3% LESS', '30 DAYS 3% LESS', 'Domestic', true),
('15 DAYS 2%', '15 DAYS 2% LESS', 'Domestic', true),
('7', '7', 'Domestic', true),
('90', '90', 'Domestic', true),
('30', '30', 'Domestic', true),
('45', '45', 'Domestic', true),
('45DAYS 3+1', '45', 'Domestic', true),
('7DAYS 4+1', '7', 'Domestic', true),
('90DAYS 1%', '90', 'Domestic', true),
('30DAYS 3+1', '30', 'Domestic', true);

-- =============================================
-- VERIFICATION QUERIES
-- =============================================
-- Run these after creating tables to verify data:
-- SELECT COUNT(*) as agent_count FROM agents;
-- SELECT COUNT(*) as consignee_count FROM consignees;
-- SELECT COUNT(*) as godown_count FROM godown_locations;
-- SELECT COUNT(*) as insurance_count FROM insurance_companies;
-- SELECT COUNT(*) as buyer_count FROM domestic_buyers;
-- SELECT COUNT(*) as payment_count FROM payment_terms;
-- SELECT * FROM agents ORDER BY name;
-- SELECT * FROM consignees ORDER BY name;
-- SELECT * FROM godown_locations ORDER BY name;
-- SELECT * FROM insurance_companies ORDER BY company_name;
-- SELECT * FROM domestic_buyers ORDER BY buyer_name;
-- SELECT * FROM payment_terms ORDER BY name;
