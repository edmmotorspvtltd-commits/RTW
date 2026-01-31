-- ============================================
-- TERMS AND CONDITIONS TABLE
-- ============================================
DROP TABLE IF EXISTS terms_and_conditions CASCADE;

CREATE TABLE terms_and_conditions (
    terms_and_condition_id SERIAL PRIMARY KEY,
    terms_name VARCHAR(255) NOT NULL,
    description TEXT,
    terms_and_condition_for VARCHAR(50) DEFAULT 'Domestic',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pre-data
INSERT INTO terms_and_conditions (terms_and_condition_id, terms_name, description, terms_and_condition_for, is_active)
VALUES 
(1, '.DOMESTIC INSURANCE', 'THE ORIENTAL INSURANCE COMPANY LIMITED - 162602/21/2025/42', 'Domestic', TRUE);

SELECT setval('terms_and_conditions_terms_and_condition_id_seq', (SELECT COALESCE(MAX(terms_and_condition_id), 1) FROM terms_and_conditions));


-- ============================================
-- TRANSPORTATION TABLE
-- ============================================
DROP TABLE IF EXISTS transportations CASCADE;

CREATE TABLE transportations (
    transportation_id SERIAL PRIMARY KEY,
    transportation_name VARCHAR(255) NOT NULL,
    contact_number VARCHAR(50),
    address TEXT,
    gst_number VARCHAR(20),
    remark VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pre-data
INSERT INTO transportations (transportation_id, transportation_name, contact_number, address, gst_number, remark, is_active)
VALUES 
(1, 'TEMPO', NULL, NULL, 'MH09FL6803', NULL, TRUE),
(2, 'SHRI DATTA CARYING CORPORATION', NULL, '12/100 BUNGLOW ROAD ICHALKARANJI', '27ATDPJ8375R1ZR', NULL, TRUE),
(3, 'NIRMAL WAREHOUSE AND TRANSPORTATION LLP', NULL, 'ICHALKARANJI', '27AAOFN7452R1Z8', NULL, TRUE),
(4, 'SHRI MAHAGANPATI ROADLINES', NULL, '18/281 , NEAR MANE FOUNDRY ,BEHIND SUNIL TRADERS , ICHALAKRANJJI', '27BAYPG9791D2ZX', 'SMR', TRUE);

SELECT setval('transportations_transportation_id_seq', (SELECT COALESCE(MAX(transportation_id), 1) FROM transportations));