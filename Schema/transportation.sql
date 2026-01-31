-- ============================================
-- Transportation Master Table
-- Stores transportation/logistics company information
-- ============================================

DROP TABLE IF EXISTS transportation CASCADE;

CREATE TABLE transportation (
    id SERIAL PRIMARY KEY,
    transportation_name VARCHAR(255) NOT NULL,
    contact_number VARCHAR(50),
    address TEXT,
    gst_number VARCHAR(20),
    remark TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER
);

-- Indexes
CREATE INDEX idx_transportation_name ON transportation(transportation_name);
CREATE INDEX idx_transportation_gst ON transportation(gst_number);
CREATE INDEX idx_transportation_active ON transportation(is_active);

-- Pre-populated Data (12 records)
INSERT INTO transportation (transportation_name, contact_number, address, gst_number, remark) VALUES
('TEMPO', NULL, NULL, 'MH09FL6803', NULL),
('SHRI DATTA CARYING CORPORATION', NULL, '12/100 BUNGLOW ROAD ICHALKARANJI', '27ATDPJ8375R1ZR', NULL),
('NIRMAL WAREHOUSE AND TRANSPORTATION LLP', NULL, 'ICHALKARANJI', '27AAOFN7452R1Z8', NULL),
('SHRI MAHAGANPATI ROADLINES', NULL, '18/281 , NEAR MANE FOUNDRY ,BEHIND SUNIL TRADERS , ICHALAKRANJJI', '27BAYPG9791D2ZX', 'SMR'),
('SARGAM TRANSPORT', NULL, 'OLD BUS STAND,NEAR NAVNALE SIZING ICHALKARANJI', '27AFZPG2064C1ZE', NULL),
('MOONGIPA ROADWAYS', NULL, 'ICHALKARANJI', '27AACCM2857L1Z4', NULL),
('ROYAL TRANSPORT', NULL, 'ICHALKARANJI', '27BKQPS4222P1ZC', NULL),
('SHIV SHAKTI LOGISTICS', NULL, 'ICHALKARANJI', '24AIBPR8897H1ZN', 'SSL'),
('MAHALAXMI CARGO SERVICES', NULL, NULL, '27AAPFM7768N1Z5', NULL),
('SHREE MARUTI', NULL, NULL, '27AABCM94407D2ZL', NULL),
('DHANLAXMI CARGO SERVICES', NULL, NULL, '24AATFD4378B1ZD', NULL),
('KHANDELWAL TRANSPORT', NULL, NULL, '27BOBPK6897P1ZY', NULL);
