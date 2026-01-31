// Master Data Routes - Agents & Consignees
const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// ========================================
// AGENTS ROUTES
// ========================================

// GET all agents (with search & pagination)
router.get('/agents', async (req, res) => {
    try {
        const { search, page = 1, limit = 20, active } = req.query;
        const offset = (page - 1) * limit;

        let query = 'SELECT * FROM agents WHERE 1=1';
        const params = [];

        if (search) {
            params.push(`%${search}%`);
            query += ` AND name ILIKE $${params.length}`;
        }

        if (active !== undefined) {
            params.push(active === 'true');
            query += ` AND is_active = $${params.length}`;
        }

        // Get total count
        const countResult = await pool.query(
            query.replace('SELECT *', 'SELECT COUNT(*)'),
            params
        );
        const total = parseInt(countResult.rows[0].count);

        // Get data with pagination
        params.push(limit, offset);
        query += ` ORDER BY name ASC LIMIT $${params.length - 1} OFFSET $${params.length}`;

        const result = await pool.query(query, params);

        res.json({
            success: true,
            data: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching agents:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET agents for dropdown
router.get('/agents/dropdown', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, name FROM agents WHERE is_active = true ORDER BY name'
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET single agent
router.get('/agents/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM agents WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Agent not found' });
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// CREATE agent
router.post('/agents', async (req, res) => {
    try {
        const { name, country, primary_contact, secondary_contact, address, pin_code, agent_percent } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, message: 'Agent name is required' });
        }

        const result = await pool.query(
            `INSERT INTO agents (name, country, primary_contact, secondary_contact, address, pin_code, agent_percent)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [name, country || 'INDIA', primary_contact, secondary_contact, address, pin_code, agent_percent || 0]
        );

        res.status(201).json({ success: true, data: result.rows[0], message: 'Agent created successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// UPDATE agent
router.put('/agents/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, country, primary_contact, secondary_contact, address, pin_code, agent_percent, is_active } = req.body;

        const result = await pool.query(
            `UPDATE agents 
             SET name = COALESCE($1, name),
                 country = COALESCE($2, country),
                 primary_contact = COALESCE($3, primary_contact),
                 secondary_contact = COALESCE($4, secondary_contact),
                 address = COALESCE($5, address),
                 pin_code = COALESCE($6, pin_code),
                 agent_percent = COALESCE($7, agent_percent),
                 is_active = COALESCE($8, is_active)
             WHERE id = $9
             RETURNING *`,
            [name, country, primary_contact, secondary_contact, address, pin_code, agent_percent, is_active, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Agent not found' });
        }

        res.json({ success: true, data: result.rows[0], message: 'Agent updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE agent (soft delete)
router.delete('/agents/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'UPDATE agents SET is_active = false WHERE id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Agent not found' });
        }

        res.json({ success: true, message: 'Agent deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ========================================
// CONSIGNEES ROUTES
// ========================================

// GET all consignees (with search & pagination)
router.get('/consignees', async (req, res) => {
    try {
        const { search, page = 1, limit = 20, active } = req.query;
        const offset = (page - 1) * limit;

        let query = 'SELECT * FROM consignees WHERE 1=1';
        const params = [];

        if (search) {
            params.push(`%${search}%`);
            query += ` AND (name ILIKE $${params.length} OR city ILIKE $${params.length} OR gstn ILIKE $${params.length})`;
        }

        if (active !== undefined) {
            params.push(active === 'true');
            query += ` AND is_active = $${params.length}`;
        }

        // Get total count
        const countResult = await pool.query(
            query.replace('SELECT *', 'SELECT COUNT(*)'),
            params
        );
        const total = parseInt(countResult.rows[0].count);

        // Get data with pagination
        params.push(limit, offset);
        query += ` ORDER BY name ASC LIMIT $${params.length - 1} OFFSET $${params.length}`;

        const result = await pool.query(query, params);

        res.json({
            success: true,
            data: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching consignees:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET consignees for dropdown
router.get('/consignees/dropdown', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, name, city FROM consignees WHERE is_active = true ORDER BY name'
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET single consignee
router.get('/consignees/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM consignees WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Consignee not found' });
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// CREATE consignee
router.post('/consignees', async (req, res) => {
    try {
        const { name, state, city, gstn, address, pin_code, contact_no, is_active } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, message: 'Consignee name is required' });
        }

        const result = await pool.query(
            `INSERT INTO consignees (name, state, city, gstn, address, pin_code, contact_no, is_active)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING *`,
            [name, state, city, gstn, address, pin_code, contact_no, is_active !== false]
        );

        res.status(201).json({ success: true, data: result.rows[0], message: 'Consignee created successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// UPDATE consignee
router.put('/consignees/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, state, city, gstn, address, pin_code, contact_no, is_active } = req.body;

        const result = await pool.query(
            `UPDATE consignees 
             SET name = COALESCE($1, name),
                 state = COALESCE($2, state),
                 city = COALESCE($3, city),
                 gstn = COALESCE($4, gstn),
                 address = COALESCE($5, address),
                 pin_code = COALESCE($6, pin_code),
                 contact_no = COALESCE($7, contact_no),
                 is_active = COALESCE($8, is_active)
             WHERE id = $9
             RETURNING *`,
            [name, state, city, gstn, address, pin_code, contact_no, is_active, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Consignee not found' });
        }

        res.json({ success: true, data: result.rows[0], message: 'Consignee updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE consignee (soft delete)
router.delete('/consignees/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'UPDATE consignees SET is_active = false WHERE id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Consignee not found' });
        }

        res.json({ success: true, message: 'Consignee deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ========================================
// GODOWN LOCATIONS ROUTES
// ========================================

// GET all godowns (with search & pagination)
router.get('/godowns', async (req, res) => {
    try {
        const { search, page = 1, limit = 20, active } = req.query;
        const offset = (page - 1) * limit;

        let query = 'SELECT * FROM godown_locations WHERE 1=1';
        const params = [];

        if (search) {
            params.push(`%${search}%`);
            query += ` AND (name ILIKE $${params.length} OR location ILIKE $${params.length} OR location_type ILIKE $${params.length})`;
        }

        if (active !== undefined) {
            params.push(active === 'true');
            query += ` AND is_active = $${params.length}`;
        }

        // Get total count
        const countResult = await pool.query(
            query.replace('SELECT *', 'SELECT COUNT(*)'),
            params
        );
        const total = parseInt(countResult.rows[0].count);

        // Get data with pagination
        params.push(limit, offset);
        query += ` ORDER BY name ASC LIMIT $${params.length - 1} OFFSET $${params.length}`;

        const result = await pool.query(query, params);

        res.json({
            success: true,
            data: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching godowns:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET godowns for dropdown
router.get('/godowns/dropdown', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, name, location_type FROM godown_locations WHERE is_active = true ORDER BY name'
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET single godown
router.get('/godowns/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM godown_locations WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Godown not found' });
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// CREATE godown
router.post('/godowns', async (req, res) => {
    try {
        const { name, description, location, location_code, vendor_group, location_type, is_active, is_default } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, message: 'Godown name is required' });
        }

        const result = await pool.query(
            `INSERT INTO godown_locations (name, description, location, location_code, vendor_group, location_type, is_active, is_default)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING *`,
            [name, description, location, location_code, vendor_group, location_type, is_active !== false, is_default === true]
        );

        res.status(201).json({ success: true, data: result.rows[0], message: 'Godown created successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// UPDATE godown
router.put('/godowns/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, location, location_code, vendor_group, location_type, is_active, is_default } = req.body;

        const result = await pool.query(
            `UPDATE godown_locations 
             SET name = COALESCE($1, name),
                 description = COALESCE($2, description),
                 location = COALESCE($3, location),
                 location_code = COALESCE($4, location_code),
                 vendor_group = COALESCE($5, vendor_group),
                 location_type = COALESCE($6, location_type),
                 is_active = COALESCE($7, is_active),
                 is_default = COALESCE($8, is_default),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $9
             RETURNING *`,
            [name, description, location, location_code, vendor_group, location_type, is_active, is_default, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Godown not found' });
        }

        res.json({ success: true, data: result.rows[0], message: 'Godown updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE godown (soft delete)
router.delete('/godowns/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'UPDATE godown_locations SET is_active = false WHERE id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Godown not found' });
        }

        res.json({ success: true, message: 'Godown deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ========================================
// INSURANCE COMPANIES ROUTES
// ========================================

// GET all insurance companies (with search & pagination)
router.get('/insurance', async (req, res) => {
    try {
        const { search, page = 1, limit = 20, active } = req.query;
        const offset = (page - 1) * limit;

        let query = 'SELECT * FROM insurance_companies WHERE 1=1';
        const params = [];

        if (search) {
            params.push(`%${search}%`);
            query += ` AND (company_name ILIKE $${params.length} OR policy_number ILIKE $${params.length} OR policy_type ILIKE $${params.length})`;
        }

        if (active !== undefined) {
            params.push(active === 'true');
            query += ` AND is_active = $${params.length}`;
        }

        // Get total count
        const countResult = await pool.query(
            query.replace('SELECT *', 'SELECT COUNT(*)'),
            params
        );
        const total = parseInt(countResult.rows[0].count);

        // Get data with pagination
        params.push(limit, offset);
        query += ` ORDER BY company_name ASC LIMIT $${params.length - 1} OFFSET $${params.length}`;

        const result = await pool.query(query, params);

        res.json({
            success: true,
            data: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching insurance companies:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET insurance companies for dropdown
router.get('/insurance/dropdown', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, company_name FROM insurance_companies WHERE is_active = true ORDER BY company_name'
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET single insurance company
router.get('/insurance/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM insurance_companies WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Insurance company not found' });
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// CREATE insurance company
router.post('/insurance', async (req, res) => {
    try {
        const { company_name, policy_number, policy_type, is_active } = req.body;

        if (!company_name) {
            return res.status(400).json({ success: false, message: 'Insurance Company Name is required' });
        }

        const result = await pool.query(
            `INSERT INTO insurance_companies (company_name, policy_number, policy_type, is_active)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [company_name, policy_number, policy_type, is_active !== false]
        );

        res.status(201).json({ success: true, data: result.rows[0], message: 'Insurance Company created successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// UPDATE insurance company
router.put('/insurance/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { company_name, policy_number, policy_type, is_active } = req.body;

        const result = await pool.query(
            `UPDATE insurance_companies 
             SET company_name = COALESCE($1, company_name),
                 policy_number = COALESCE($2, policy_number),
                 policy_type = COALESCE($3, policy_type),
                 is_active = COALESCE($4, is_active),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $5
             RETURNING *`,
            [company_name, policy_number, policy_type, is_active, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Insurance company not found' });
        }

        res.json({ success: true, data: result.rows[0], message: 'Insurance Company updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE insurance company (soft delete)
router.delete('/insurance/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'UPDATE insurance_companies SET is_active = false WHERE id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Insurance company not found' });
        }

        res.json({ success: true, message: 'Insurance Company deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ========================================
// DOMESTIC BUYERS ROUTES
// ========================================

// GET all domestic buyers (with search & pagination)
router.get('/domestic-buyers', async (req, res) => {
    try {
        const { search, page = 1, limit = 20, active } = req.query;
        const offset = (page - 1) * limit;

        let query = 'SELECT * FROM domestic_buyers WHERE 1=1';
        const params = [];

        if (search) {
            params.push(`%${search}%`);
            query += ` AND (buyer_name ILIKE $${params.length} OR buyer_code ILIKE $${params.length} OR city ILIKE $${params.length})`;
        }

        if (active !== undefined) {
            params.push(active === 'true');
            query += ` AND is_active = $${params.length}`;
        }

        // Get total count
        const countResult = await pool.query(
            query.replace('SELECT *', 'SELECT COUNT(*)'),
            params
        );
        const total = parseInt(countResult.rows[0].count);

        // Get data with pagination
        params.push(limit, offset);
        query += ` ORDER BY buyer_name ASC LIMIT $${params.length - 1} OFFSET $${params.length}`;

        const result = await pool.query(query, params);

        res.json({
            success: true,
            data: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching domestic buyers:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ================================================
// AGENTS ROUTES
// ================================================

// GET all agents (for dropdown)
router.get('/agents', async (req, res) => {
    try {
        const query = `
            SELECT id, name, email, phone, city, is_active
            FROM agents
            WHERE is_active = true
            ORDER BY name ASC
        `;

        const result = await pool.query(query);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching agents:', error);
        // If table doesn't exist, return empty array
        if (error.code === '42P01') {
            return res.json({
                success: true,
                data: [],
                message: 'Agents table not found'
            });
        }
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET domestic buyers for dropdown
router.get('/domestic-buyers/dropdown', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, buyer_name FROM domestic_buyers WHERE is_active = true ORDER BY buyer_name'
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET single domestic buyer (with consignees and representatives)
router.get('/domestic-buyers/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Get buyer data
        const buyerResult = await pool.query('SELECT * FROM domestic_buyers WHERE id = $1', [id]);
        if (buyerResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Domestic Buyer not found' });
        }

        const buyer = buyerResult.rows[0];

        // Get buyer consignees
        const consigneesResult = await pool.query(
            'SELECT * FROM buyer_consignees WHERE buyer_id = $1 ORDER BY id',
            [id]
        );

        // Get buyer representatives
        const representativesResult = await pool.query(
            'SELECT * FROM buyer_representatives WHERE buyer_id = $1 ORDER BY id',
            [id]
        );

        buyer.consignees = consigneesResult.rows;
        buyer.representatives = representativesResult.rows;

        res.json({ success: true, data: buyer });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// CREATE domestic buyer (with consignees and representatives)
router.post('/domestic-buyers', async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const {
            buyer_name, buyer_code, gst_number, country, state, city,
            address_line1, address_line2, address_line3, pin_code, phone_no, email,
            bank_name, bank_country, bank_state, bank_state_code, bank_address, bank_pincode, bank_city,
            credit_limit, interest_percent,
            gst_reg_type, is_consignee_buyer, account_group, vendor_group, pan_number, is_tcs_applied, buyer_collectee_type,
            market, sector, is_self, is_insurance_applied, msme_type, sales_type, whatsapp_no, whatsapp_group_id,
            representative_name, created_in, is_active,
            consignees, representatives
        } = req.body;

        if (!buyer_name) {
            return res.status(400).json({ success: false, message: 'Buyer Name is required' });
        }

        // Auto-generate buyer_code if not provided (format: RTWDB-001, RTWDB-002, etc.)
        let finalBuyerCode = buyer_code;
        if (!finalBuyerCode || finalBuyerCode.trim() === '') {
            const seqResult = await client.query(
                `SELECT buyer_code FROM domestic_buyers 
                 WHERE buyer_code LIKE 'RTWDB-%' 
                 ORDER BY CAST(SUBSTRING(buyer_code FROM 7) AS INTEGER) DESC 
                 LIMIT 1`
            );

            let nextSeq = 1;
            if (seqResult.rows.length > 0) {
                const lastCode = seqResult.rows[0].buyer_code;
                const lastNum = parseInt(lastCode.replace('RTWDB-', ''), 10);
                if (!isNaN(lastNum)) {
                    nextSeq = lastNum + 1;
                }
            }
            finalBuyerCode = 'RTWDB-' + String(nextSeq).padStart(3, '0');
        }

        // Insert main buyer
        const result = await client.query(
            `INSERT INTO domestic_buyers (
                buyer_name, buyer_code, gst_number, country, state, city,
                address_line1, address_line2, address_line3, pin_code, phone_no, email,
                bank_name, bank_country, bank_state, bank_state_code, bank_address, bank_pincode, bank_city,
                credit_limit, interest_percent,
                gst_reg_type, is_consignee_buyer, account_group, vendor_group, pan_number, is_tcs_applied, buyer_collectee_type,
                market, sector, is_self, is_insurance_applied, msme_type, sales_type, whatsapp_no, whatsapp_group_id,
                representative_name, created_in, is_active
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36,$37,$38,$39)
             RETURNING *`,
            [
                buyer_name, finalBuyerCode, gst_number, country || 'INDIA', state, city,
                address_line1, address_line2, address_line3, pin_code, phone_no, email,
                bank_name, bank_country, bank_state, bank_state_code, bank_address, bank_pincode, bank_city,
                credit_limit, interest_percent,
                gst_reg_type, is_consignee_buyer || false, account_group, vendor_group, pan_number, is_tcs_applied || false, buyer_collectee_type,
                market, sector, is_self || false, is_insurance_applied || false, msme_type, sales_type, whatsapp_no, whatsapp_group_id,
                representative_name, created_in || 'Trading', is_active !== false
            ]
        );

        const buyerId = result.rows[0].id;

        // Insert consignees if provided
        if (consignees && Array.isArray(consignees) && consignees.length > 0) {
            for (const c of consignees) {
                await client.query(
                    `INSERT INTO buyer_consignees (buyer_id, name, country, state, city, address, pin_code, phone_number, email, gstn)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                    [buyerId, c.name, c.country || 'INDIA', c.state, c.city, c.address, c.pin_code, c.phone_number, c.email_id || c.email, c.gstn]
                );
            }
        }

        // Insert representatives if provided
        if (representatives && Array.isArray(representatives) && representatives.length > 0) {
            for (const r of representatives) {
                await client.query(
                    `INSERT INTO buyer_representatives (buyer_id, representative_name, contact_number)
                     VALUES ($1, $2, $3)`,
                    [buyerId, r.representative_name, r.contact_number]
                );
            }
        }

        await client.query('COMMIT');
        res.status(201).json({ success: true, data: result.rows[0], message: 'Domestic Buyer created successfully' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creating domestic buyer:', error);
        res.status(500).json({ success: false, message: error.message });
    } finally {
        client.release();
    }
});

// UPDATE domestic buyer (with consignees and representatives)
router.put('/domestic-buyers/:id', async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const { id } = req.params;
        const {
            buyer_name, buyer_code, gst_number, country, state, city,
            address_line1, address_line2, address_line3, pin_code, phone_no, email,
            bank_name, bank_country, bank_state, bank_state_code, bank_address, bank_pincode, bank_city,
            credit_limit, interest_percent,
            gst_reg_type, is_consignee_buyer, account_group, vendor_group, pan_number, is_tcs_applied, buyer_collectee_type,
            market, sector, is_self, is_insurance_applied, msme_type, sales_type, whatsapp_no, whatsapp_group_id,
            representative_name, created_in, is_active,
            consignees, representatives
        } = req.body;

        // Update main buyer
        const result = await client.query(
            `UPDATE domestic_buyers SET
                buyer_name = COALESCE($1, buyer_name),
                buyer_code = COALESCE($2, buyer_code),
                gst_number = COALESCE($3, gst_number),
                country = COALESCE($4, country),
                state = COALESCE($5, state),
                city = COALESCE($6, city),
                address_line1 = COALESCE($7, address_line1),
                address_line2 = COALESCE($8, address_line2),
                address_line3 = COALESCE($9, address_line3),
                pin_code = COALESCE($10, pin_code),
                phone_no = COALESCE($11, phone_no),
                email = COALESCE($12, email),
                bank_name = COALESCE($13, bank_name),
                bank_country = COALESCE($14, bank_country),
                bank_state = COALESCE($15, bank_state),
                bank_state_code = COALESCE($16, bank_state_code),
                bank_address = COALESCE($17, bank_address),
                bank_pincode = COALESCE($18, bank_pincode),
                bank_city = COALESCE($19, bank_city),
                credit_limit = COALESCE($20, credit_limit),
                interest_percent = COALESCE($21, interest_percent),
                gst_reg_type = COALESCE($22, gst_reg_type),
                is_consignee_buyer = COALESCE($23, is_consignee_buyer),
                account_group = COALESCE($24, account_group),
                vendor_group = COALESCE($25, vendor_group),
                pan_number = COALESCE($26, pan_number),
                is_tcs_applied = COALESCE($27, is_tcs_applied),
                buyer_collectee_type = COALESCE($28, buyer_collectee_type),
                market = COALESCE($29, market),
                sector = COALESCE($30, sector),
                is_self = COALESCE($31, is_self),
                is_insurance_applied = COALESCE($32, is_insurance_applied),
                msme_type = COALESCE($33, msme_type),
                sales_type = COALESCE($34, sales_type),
                whatsapp_no = COALESCE($35, whatsapp_no),
                whatsapp_group_id = COALESCE($36, whatsapp_group_id),
                representative_name = COALESCE($37, representative_name),
                created_in = COALESCE($38, created_in),
                is_active = COALESCE($39, is_active),
                updated_at = CURRENT_TIMESTAMP
             WHERE id = $40
             RETURNING *`,
            [
                buyer_name, buyer_code, gst_number, country, state, city,
                address_line1, address_line2, address_line3, pin_code, phone_no, email,
                bank_name, bank_country, bank_state, bank_state_code, bank_address, bank_pincode, bank_city,
                credit_limit, interest_percent,
                gst_reg_type, is_consignee_buyer, account_group, vendor_group, pan_number, is_tcs_applied, buyer_collectee_type,
                market, sector, is_self, is_insurance_applied, msme_type, sales_type, whatsapp_no, whatsapp_group_id,
                representative_name, created_in, is_active, id
            ]
        );

        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, message: 'Domestic Buyer not found' });
        }

        // Update consignees if provided (delete old, insert new)
        if (consignees && Array.isArray(consignees)) {
            await client.query('DELETE FROM buyer_consignees WHERE buyer_id = $1', [id]);
            for (const c of consignees) {
                if (c.name) {
                    await client.query(
                        `INSERT INTO buyer_consignees (buyer_id, name, country, state, city, address, pin_code, phone_number, email, gstn)
                         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                        [id, c.name, c.country || 'INDIA', c.state, c.city, c.address, c.pin_code, c.phone_number, c.email_id || c.email, c.gstn]
                    );
                }
            }
        }

        // Update representatives if provided (delete old, insert new)
        if (representatives && Array.isArray(representatives)) {
            await client.query('DELETE FROM buyer_representatives WHERE buyer_id = $1', [id]);
            for (const r of representatives) {
                if (r.representative_name) {
                    await client.query(
                        `INSERT INTO buyer_representatives (buyer_id, representative_name, contact_number)
                         VALUES ($1, $2, $3)`,
                        [id, r.representative_name, r.contact_number]
                    );
                }
            }
        }

        await client.query('COMMIT');
        res.json({ success: true, data: result.rows[0], message: 'Domestic Buyer updated successfully' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error updating domestic buyer:', error);
        res.status(500).json({ success: false, message: error.message });
    } finally {
        client.release();
    }
});

// DELETE domestic buyer
router.delete('/domestic-buyers/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'UPDATE domestic_buyers SET is_active = false WHERE id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Domestic Buyer not found' });
        }

        res.json({ success: true, message: 'Domestic Buyer deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ========================================
// PAYMENT TERMS ROUTES
// ========================================

// GET all payment terms (with search & pagination)
router.get('/payment-terms', async (req, res) => {
    try {
        const { search, page = 1, limit = 20, active } = req.query;
        const offset = (page - 1) * limit;

        let query = 'SELECT * FROM payment_terms WHERE 1=1';
        const params = [];

        if (search) {
            params.push(`%${search}%`);
            query += ` AND (name ILIKE $${params.length} OR description ILIKE $${params.length})`;
        }

        if (active !== undefined) {
            params.push(active === 'true');
            query += ` AND is_active = $${params.length}`;
        }

        // Get total count
        const countResult = await pool.query(
            query.replace('SELECT *', 'SELECT COUNT(*)'),
            params
        );
        const total = parseInt(countResult.rows[0].count);

        // Get data with pagination
        params.push(limit, offset);
        query += ` ORDER BY name ASC LIMIT $${params.length - 1} OFFSET $${params.length}`;

        const result = await pool.query(query, params);

        res.json({
            success: true,
            data: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching payment terms:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET payment terms for dropdown
router.get('/payment-terms/dropdown', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, name FROM payment_terms WHERE is_active = true ORDER BY name'
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET single payment term
router.get('/payment-terms/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM payment_terms WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Payment Term not found' });
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// CREATE payment term
router.post('/payment-terms', async (req, res) => {
    try {
        const { name, description, payment_type, is_active } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, message: 'Payment Terms Name is required' });
        }

        const result = await pool.query(
            `INSERT INTO payment_terms (name, description, payment_type, is_active)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [name, description, payment_type || 'Domestic', is_active !== false]
        );

        res.status(201).json({ success: true, data: result.rows[0], message: 'Payment Term created successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// UPDATE payment term
router.put('/payment-terms/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, payment_type, is_active } = req.body;

        const result = await pool.query(
            `UPDATE payment_terms 
             SET name = COALESCE($1, name),
                 description = COALESCE($2, description),
                 payment_type = COALESCE($3, payment_type),
                 is_active = COALESCE($4, is_active),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $5
             RETURNING *`,
            [name, description, payment_type, is_active, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Payment Term not found' });
        }

        res.json({ success: true, data: result.rows[0], message: 'Payment Term updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE payment term
router.delete('/payment-terms/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'UPDATE payment_terms SET is_active = false WHERE id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Payment Term not found' });
        }

        res.json({ success: true, message: 'Payment Term deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ========================================
// SOURCING BY ROUTES
// ========================================

// GET all sourcing by (with search & pagination)
router.get('/sourcing-by', async (req, res) => {
    try {
        const { search, page = 1, limit = 20, active } = req.query;
        const offset = (page - 1) * limit;

        let query = 'SELECT * FROM sourcing_by WHERE 1=1';
        const params = [];

        if (search) {
            params.push(`%${search}%`);
            query += ` AND name ILIKE $${params.length}`;
        }

        if (active !== undefined) {
            params.push(active === 'true');
            query += ` AND is_active = $${params.length}`;
        }

        // Get total count
        const countResult = await pool.query(
            query.replace('SELECT *', 'SELECT COUNT(*)'),
            params
        );
        const total = parseInt(countResult.rows[0].count);

        // Get data with pagination
        params.push(limit, offset);
        query += ` ORDER BY name ASC LIMIT $${params.length - 1} OFFSET $${params.length}`;

        const result = await pool.query(query, params);

        res.json({
            success: true,
            data: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching sourcing by:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET sourcing by for dropdown
router.get('/sourcing-by/dropdown', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, name FROM sourcing_by WHERE is_active = true ORDER BY name'
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET single sourcing by
router.get('/sourcing-by/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM sourcing_by WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Sourcing By not found' });
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// CREATE sourcing by
router.post('/sourcing-by', async (req, res) => {
    try {
        const { name, is_active } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, message: 'Sourcing Name is required' });
        }

        const result = await pool.query(
            `INSERT INTO sourcing_by (name, is_active)
             VALUES ($1, $2)
             RETURNING *`,
            [name.toUpperCase(), is_active !== false]
        );

        res.status(201).json({ success: true, data: result.rows[0], message: 'Sourcing By created successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// UPDATE sourcing by
router.put('/sourcing-by/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, is_active } = req.body;

        const result = await pool.query(
            `UPDATE sourcing_by 
             SET name = COALESCE($1, name),
                 is_active = COALESCE($2, is_active),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $3
             RETURNING *`,
            [name ? name.toUpperCase() : null, is_active, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Sourcing By not found' });
        }

        res.json({ success: true, data: result.rows[0], message: 'Sourcing By updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE sourcing by (soft delete)
router.delete('/sourcing-by/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'UPDATE sourcing_by SET is_active = false WHERE id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Sourcing By not found' });
        }

        res.json({ success: true, message: 'Sourcing By deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ========================================
// STOCK TYPES ROUTES
// ========================================

// GET all stock types (with search & pagination)
router.get('/stock-types', async (req, res) => {
    try {
        const { search, page = 1, limit = 20, active } = req.query;
        const offset = (page - 1) * limit;

        let query = 'SELECT * FROM stock_types WHERE 1=1';
        const params = [];

        if (search) {
            params.push(`%${search}%`);
            query += ` AND (name ILIKE $${params.length} OR code ILIKE $${params.length})`;
        }

        if (active !== undefined) {
            params.push(active === 'true');
            query += ` AND is_active = $${params.length}`;
        }

        // Get total count
        const countResult = await pool.query(
            query.replace('SELECT *', 'SELECT COUNT(*)'),
            params
        );
        const total = parseInt(countResult.rows[0].count);

        // Get data with pagination
        params.push(limit, offset);
        query += ` ORDER BY name ASC LIMIT $${params.length - 1} OFFSET $${params.length}`;

        const result = await pool.query(query, params);

        res.json({
            success: true,
            data: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching stock types:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET stock types for dropdown
router.get('/stock-types/dropdown', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, name, code FROM stock_types WHERE is_active = true ORDER BY name'
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET single stock type
router.get('/stock-types/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM stock_types WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Stock Type not found' });
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// CREATE stock type
router.post('/stock-types', async (req, res) => {
    try {
        const { name, code, is_active } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, message: 'Stock Type Name is required' });
        }
        if (!code) {
            return res.status(400).json({ success: false, message: 'Stock Type Code is required' });
        }

        const result = await pool.query(
            `INSERT INTO stock_types (name, code, is_active)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [name.toUpperCase(), code.toUpperCase(), is_active !== false]
        );

        res.status(201).json({ success: true, data: result.rows[0], message: 'Stock Type created successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// UPDATE stock type
router.put('/stock-types/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, code, is_active } = req.body;

        const result = await pool.query(
            `UPDATE stock_types 
             SET name = COALESCE($1, name),
                 code = COALESCE($2, code),
                 is_active = COALESCE($3, is_active),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $4
             RETURNING *`,
            [name ? name.toUpperCase() : null, code ? code.toUpperCase() : null, is_active, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Stock Type not found' });
        }

        res.json({ success: true, data: result.rows[0], message: 'Stock Type updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE stock type (soft delete)
router.delete('/stock-types/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'UPDATE stock_types SET is_active = false WHERE id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Stock Type not found' });
        }

        res.json({ success: true, message: 'Stock Type deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ========================================
// TERMS & CONDITIONS ROUTES
// ========================================

// GET all terms & conditions (with search & pagination)
router.get('/terms-conditions', async (req, res) => {
    try {
        const { search, page = 1, limit = 20, active } = req.query;
        const offset = (page - 1) * limit;

        let query = 'SELECT * FROM terms_conditions WHERE 1=1';
        const params = [];

        if (search) {
            params.push(`%${search}%`);
            query += ` AND (terms_name ILIKE $${params.length} OR description ILIKE $${params.length})`;
        }

        if (active !== undefined) {
            params.push(active === 'true');
            query += ` AND is_active = $${params.length}`;
        }

        // Get total count
        const countResult = await pool.query(
            query.replace('SELECT *', 'SELECT COUNT(*)'),
            params
        );
        const total = parseInt(countResult.rows[0].count);

        // Get data with pagination
        params.push(limit, offset);
        query += ` ORDER BY terms_name ASC LIMIT $${params.length - 1} OFFSET $${params.length}`;

        const result = await pool.query(query, params);

        res.json({
            success: true,
            data: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching terms & conditions:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET terms for dropdown
router.get('/terms-conditions/dropdown', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, terms_name FROM terms_conditions WHERE is_active = true ORDER BY terms_name'
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET single terms & conditions
router.get('/terms-conditions/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM terms_conditions WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Terms & Conditions not found' });
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// CREATE terms & conditions
router.post('/terms-conditions', async (req, res) => {
    try {
        const { terms_name, description, terms_for } = req.body;

        if (!terms_name) {
            return res.status(400).json({ success: false, message: 'Terms name is required' });
        }

        const result = await pool.query(
            `INSERT INTO terms_conditions (terms_name, description, terms_for)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [terms_name, description, terms_for || 'Domestic']
        );

        res.status(201).json({ success: true, data: result.rows[0], message: 'Terms & Conditions created successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// UPDATE terms & conditions
router.put('/terms-conditions/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { terms_name, description, terms_for, is_active } = req.body;

        const result = await pool.query(
            `UPDATE terms_conditions SET 
             terms_name = COALESCE($1, terms_name),
             description = COALESCE($2, description),
             terms_for = COALESCE($3, terms_for),
             is_active = COALESCE($4, is_active),
             updated_at = CURRENT_TIMESTAMP
             WHERE id = $5
             RETURNING *`,
            [terms_name, description, terms_for, is_active, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Terms & Conditions not found' });
        }

        res.json({ success: true, data: result.rows[0], message: 'Terms & Conditions updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE terms & conditions (soft delete)
router.delete('/terms-conditions/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'UPDATE terms_conditions SET is_active = false WHERE id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Terms & Conditions not found' });
        }

        res.json({ success: true, message: 'Terms & Conditions deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ========================================
// TRANSPORTATION ROUTES
// ========================================

// GET all transportation (with search & pagination)
router.get('/transportation', async (req, res) => {
    try {
        const { search, page = 1, limit = 20, active } = req.query;
        const offset = (page - 1) * limit;

        let query = 'SELECT * FROM transportation WHERE 1=1';
        const params = [];

        if (search) {
            params.push(`%${search}%`);
            query += ` AND (transportation_name ILIKE $${params.length} OR gst_number ILIKE $${params.length})`;
        }

        if (active !== undefined) {
            params.push(active === 'true');
            query += ` AND is_active = $${params.length}`;
        }

        // Get total count
        const countResult = await pool.query(
            query.replace('SELECT *', 'SELECT COUNT(*)'),
            params
        );
        const total = parseInt(countResult.rows[0].count);

        // Get data with pagination
        params.push(limit, offset);
        query += ` ORDER BY transportation_name ASC LIMIT $${params.length - 1} OFFSET $${params.length}`;

        const result = await pool.query(query, params);

        res.json({
            success: true,
            data: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching transportation:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET transportation for dropdown
router.get('/transportation/dropdown', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, transportation_name FROM transportation WHERE is_active = true ORDER BY transportation_name'
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET single transportation
router.get('/transportation/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM transportation WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Transportation not found' });
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// CREATE transportation
router.post('/transportation', async (req, res) => {
    try {
        const { transportation_name, contact_number, address, gst_number, remark } = req.body;

        if (!transportation_name) {
            return res.status(400).json({ success: false, message: 'Transportation name is required' });
        }

        const result = await pool.query(
            `INSERT INTO transportation (transportation_name, contact_number, address, gst_number, remark)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [transportation_name, contact_number, address, gst_number, remark]
        );

        res.status(201).json({ success: true, data: result.rows[0], message: 'Transportation created successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// UPDATE transportation
router.put('/transportation/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { transportation_name, contact_number, address, gst_number, remark, is_active } = req.body;

        const result = await pool.query(
            `UPDATE transportation SET 
             transportation_name = COALESCE($1, transportation_name),
             contact_number = COALESCE($2, contact_number),
             address = COALESCE($3, address),
             gst_number = COALESCE($4, gst_number),
             remark = COALESCE($5, remark),
             is_active = COALESCE($6, is_active),
             updated_at = CURRENT_TIMESTAMP
             WHERE id = $7
             RETURNING *`,
            [transportation_name, contact_number, address, gst_number, remark, is_active, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Transportation not found' });
        }

        res.json({ success: true, data: result.rows[0], message: 'Transportation updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE transportation (soft delete)
router.delete('/transportation/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'UPDATE transportation SET is_active = false WHERE id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Transportation not found' });
        }

        res.json({ success: true, message: 'Transportation deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ========================================
// VENDOR GROUPS ROUTES
// ========================================

// GET all vendor groups (with search & pagination)
router.get('/vendor-groups', async (req, res) => {
    try {
        const { search, page = 1, limit = 20, active } = req.query;
        const offset = (page - 1) * limit;

        let query = 'SELECT * FROM vendor_groups WHERE 1=1';
        const params = [];

        if (search) {
            params.push(`%${search}%`);
            query += ` AND name ILIKE $${params.length}`;
        }

        if (active !== undefined) {
            params.push(active === 'true');
            query += ` AND is_active = $${params.length}`;
        }

        // Get total count
        const countResult = await pool.query(
            query.replace('SELECT *', 'SELECT COUNT(*)'),
            params
        );
        const total = parseInt(countResult.rows[0].count);

        // Get data with pagination
        params.push(limit, offset);
        query += ` ORDER BY name ASC LIMIT $${params.length - 1} OFFSET $${params.length}`;

        // Select name as group_name for frontend compatibility
        query = query.replace('SELECT *', 'SELECT id, name as group_name, group_type_id, is_active');

        const result = await pool.query(query, params);

        res.json({
            success: true,
            data: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching vendor groups:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET vendor groups for dropdown
router.get('/vendor-groups/dropdown', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, name as group_name FROM vendor_groups WHERE is_active = true ORDER BY name'
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET single vendor group
router.get('/vendor-groups/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT id, name as group_name, group_type_id, is_active FROM vendor_groups WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Vendor Group not found' });
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// CREATE vendor group
router.post('/vendor-groups', async (req, res) => {
    try {
        const { group_name, group_type_id } = req.body;

        if (!group_name) {
            return res.status(400).json({ success: false, message: 'Group name is required' });
        }

        const result = await pool.query(
            `INSERT INTO vendor_groups (name, group_type_id)
             VALUES ($1, $2)
             RETURNING id, name as group_name, group_type_id, is_active`,
            [group_name, group_type_id]
        );

        res.status(201).json({ success: true, data: result.rows[0], message: 'Vendor Group created successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// UPDATE vendor group
router.put('/vendor-groups/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { group_name, group_type_id, is_active } = req.body;

        const result = await pool.query(
            `UPDATE vendor_groups SET 
             name = COALESCE($1, name),
             group_type_id = COALESCE($2, group_type_id),
             is_active = COALESCE($3, is_active)
             WHERE id = $4
             RETURNING id, name as group_name, group_type_id, is_active`,
            [group_name, group_type_id, is_active, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Vendor Group not found' });
        }

        res.json({ success: true, data: result.rows[0], message: 'Vendor Group updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE vendor group (soft delete)
router.delete('/vendor-groups/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'UPDATE vendor_groups SET is_active = false WHERE id = $1 RETURNING id, name as group_name, group_type_id, is_active',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Vendor Group not found' });
        }

        res.json({ success: true, message: 'Vendor Group deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ========================================
// VENDOR PREFIXES ROUTES
// ========================================

// GET all vendor prefixes
router.get('/vendor-prefixes', async (req, res) => {
    try {
        const { search, active } = req.query;
        let query = 'SELECT * FROM vendor_prefixes WHERE 1=1';
        const params = [];

        if (search) {
            params.push(`%${search}%`);
            query += ` AND prefix ILIKE $${params.length}`;
        }

        if (active !== undefined) {
            params.push(active === 'true');
            query += ` AND is_active = $${params.length}`;
        }

        query += ' ORDER BY prefix ASC';

        const result = await pool.query(query, params);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// CREATE vendor prefix
router.post('/vendor-prefixes', async (req, res) => {
    try {
        const { prefix, is_active } = req.body;
        if (!prefix) return res.status(400).json({ success: false, message: 'Prefix is required' });

        const result = await pool.query(
            'INSERT INTO vendor_prefixes (prefix, is_active) VALUES ($1, $2) RETURNING *',
            [prefix, is_active !== false]
        );
        res.status(201).json({ success: true, data: result.rows[0], message: 'Vendor prefix created successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// UPDATE vendor prefix
router.put('/vendor-prefixes/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { prefix, is_active } = req.body;

        const result = await pool.query(
            'UPDATE vendor_prefixes SET prefix = COALESCE($1, prefix), is_active = COALESCE($2, is_active) WHERE id = $3 RETURNING *',
            [prefix, is_active, id]
        );

        if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Prefix not found' });
        res.json({ success: true, data: result.rows[0], message: 'Vendor prefix updated' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE vendor prefix
router.delete('/vendor-prefixes/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('UPDATE vendor_prefixes SET is_active = false WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Prefix not found' });
        res.json({ success: true, message: 'Vendor prefix deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ========================================
// VENDORS ROUTES
// ========================================

// GET all vendors (with search & pagination)
router.get('/vendors', async (req, res) => {
    try {
        const { search, page = 1, limit = 20, active, group_name } = req.query;
        const offset = (page - 1) * limit;

        // Use actual DB columns: code, name, group_name, gstn (not vendor_code, vendor_name, etc.)
        let query = `SELECT * FROM vendors WHERE 1=1`;
        const params = [];

        if (search) {
            params.push(`%${search}%`);
            query += ` AND (name ILIKE $${params.length} OR code ILIKE $${params.length} OR gstn ILIKE $${params.length})`;
        }

        if (active !== undefined) {
            params.push(active === 'true');
            query += ` AND is_active = $${params.length}`;
        }

        if (group_name) {
            params.push(group_name);
            query += ` AND group_name = $${params.length}`;
        }

        // Get total count
        const countResult = await pool.query(
            query.replace('SELECT *', 'SELECT COUNT(*)'),
            params
        );
        const total = parseInt(countResult.rows[0].count);

        // Get data with pagination
        params.push(limit, offset);
        query += ` ORDER BY name ASC LIMIT $${params.length - 1} OFFSET $${params.length}`;

        const result = await pool.query(query, params);

        res.json({
            success: true,
            data: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching vendors:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET vendors for dropdown
router.get('/vendors/dropdown', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, name as vendor_name FROM vendors WHERE is_active = true ORDER BY name'
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET single vendor
router.get('/vendors/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            `SELECT * FROM vendors WHERE id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Vendor not found' });
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// CREATE vendor
router.post('/vendors', async (req, res) => {
    try {
        const { code, name, group_name, address, city, state, pincode, gstn, is_active } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, message: 'Vendor name is required' });
        }

        const result = await pool.query(
            `INSERT INTO vendors (code, name, group_name, address, city, state, pincode, gstn, is_active)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING *`,
            [code, name, group_name, address, city, state, pincode, gstn, is_active !== false]
        );

        res.status(201).json({ success: true, data: result.rows[0], message: 'Vendor created successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// UPDATE vendor
router.put('/vendors/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { code, name, group_name, address, city, state, pincode, gstn, is_active } = req.body;

        const result = await pool.query(
            `UPDATE vendors SET 
             code = COALESCE($1, code),
             name = COALESCE($2, name),
             group_name = COALESCE($3, group_name),
             address = COALESCE($4, address),
             city = COALESCE($5, city),
             state = COALESCE($6, state),
             pincode = COALESCE($7, pincode),
             gstn = COALESCE($8, gstn),
             is_active = COALESCE($9, is_active)
             WHERE id = $10
             RETURNING *`,
            [code, name, group_name, address, city, state, pincode, gstn, is_active, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Vendor not found' });
        }

        res.json({ success: true, data: result.rows[0], message: 'Vendor updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE vendor (soft delete)
router.delete('/vendors/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'UPDATE vendors SET is_active = false WHERE id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Vendor not found' });
        }

        res.json({ success: true, message: 'Vendor deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ========================================
// TERMS & CONDITIONS ROUTES
// ========================================

// GET all terms & conditions (with search & pagination)
router.get('/terms-conditions', async (req, res) => {
    try {
        const { search, page = 1, limit = 20, active } = req.query;
        const offset = (page - 1) * limit;

        let query = 'SELECT terms_and_condition_id as id, terms_name, description, terms_and_condition_for, is_active, created_at, updated_at FROM terms_and_conditions WHERE 1=1';
        const params = [];

        if (search) {
            params.push(`%${search}%`);
            query += ` AND (terms_name ILIKE $${params.length} OR description ILIKE $${params.length})`;
        }

        if (active === 'true') {
            query += ' AND is_active = true';
        } else if (active === 'false') {
            query += ' AND is_active = false';
        }

        // Get total count
        const countResult = await pool.query(
            query.replace('SELECT *', 'SELECT COUNT(*)'),
            params
        );
        const total = parseInt(countResult.rows[0].count);

        // Add pagination
        query += ' ORDER BY terms_name ASC';
        params.push(limit);
        query += ` LIMIT $${params.length}`;
        params.push(offset);
        query += ` OFFSET $${params.length}`;

        const result = await pool.query(query, params);

        res.json({
            success: true,
            data: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching terms & conditions:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET terms & conditions for dropdown
router.get('/terms-conditions/dropdown', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT terms_and_condition_id, terms_name FROM terms_and_conditions WHERE is_active = true ORDER BY terms_name'
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET single terms & condition by ID
router.get('/terms-conditions/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'SELECT terms_and_condition_id as id, terms_name, description, terms_and_condition_for, is_active, created_at, updated_at FROM terms_and_conditions WHERE terms_and_condition_id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Terms & Condition not found' });
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// CREATE terms & condition
router.post('/terms-conditions', async (req, res) => {
    try {
        const { terms_name, description, terms_and_condition_for, is_active } = req.body;

        if (!terms_name) {
            return res.status(400).json({ success: false, message: 'Terms name is required' });
        }

        const result = await pool.query(
            `INSERT INTO terms_and_conditions (terms_name, description, terms_and_condition_for, is_active)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [terms_name, description, terms_and_condition_for || 'Domestic', is_active !== false]
        );

        res.status(201).json({ success: true, data: result.rows[0], message: 'Terms & Condition created successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// UPDATE terms & condition
router.put('/terms-conditions/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { terms_name, description, terms_and_condition_for, is_active } = req.body;

        const result = await pool.query(
            `UPDATE terms_and_conditions 
             SET terms_name = $1, description = $2, terms_and_condition_for = $3, is_active = $4, updated_at = CURRENT_TIMESTAMP
             WHERE terms_and_condition_id = $5 RETURNING *`,
            [terms_name, description, terms_and_condition_for, is_active, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Terms & Condition not found' });
        }

        res.json({ success: true, data: result.rows[0], message: 'Terms & Condition updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE terms & condition (soft delete)
router.delete('/terms-conditions/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'UPDATE terms_and_conditions SET is_active = false WHERE terms_and_condition_id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Terms & Condition not found' });
        }

        res.json({ success: true, message: 'Terms & Condition deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ========================================
// TRANSPORTATION ROUTES
// ========================================

// GET all transportations (with search & pagination)
router.get('/transportations', async (req, res) => {
    try {
        const { search, page = 1, limit = 20, active } = req.query;
        const offset = (page - 1) * limit;

        let query = 'SELECT * FROM transportations WHERE 1=1';
        const params = [];

        if (search) {
            params.push(`%${search}%`);
            query += ` AND (transportation_name ILIKE $${params.length} OR address ILIKE $${params.length} OR gst_number ILIKE $${params.length})`;
        }

        if (active === 'true') {
            query += ' AND is_active = true';
        } else if (active === 'false') {
            query += ' AND is_active = false';
        }

        // Get total count
        const countResult = await pool.query(
            query.replace('SELECT *', 'SELECT COUNT(*)'),
            params
        );
        const total = parseInt(countResult.rows[0].count);

        // Add pagination
        query += ' ORDER BY transportation_name ASC';
        params.push(limit);
        query += ` LIMIT $${params.length}`;
        params.push(offset);
        query += ` OFFSET $${params.length}`;

        const result = await pool.query(query, params);

        res.json({
            success: true,
            data: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching transportations:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET transportations for dropdown
router.get('/transportations/dropdown', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT transportation_id, transportation_name FROM transportations WHERE is_active = true ORDER BY transportation_name'
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET single transportation by ID
router.get('/transportations/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'SELECT * FROM transportations WHERE transportation_id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Transportation not found' });
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// CREATE transportation
router.post('/transportations', async (req, res) => {
    try {
        const { transportation_name, contact_number, address, gst_number, remark, is_active } = req.body;

        if (!transportation_name) {
            return res.status(400).json({ success: false, message: 'Transportation name is required' });
        }

        const result = await pool.query(
            `INSERT INTO transportations (transportation_name, contact_number, address, gst_number, remark, is_active)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [transportation_name, contact_number, address, gst_number, remark, is_active !== false]
        );

        res.status(201).json({ success: true, data: result.rows[0], message: 'Transportation created successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// UPDATE transportation
router.put('/transportations/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { transportation_name, contact_number, address, gst_number, remark, is_active } = req.body;

        const result = await pool.query(
            `UPDATE transportations 
             SET transportation_name = $1, contact_number = $2, address = $3, gst_number = $4, remark = $5, is_active = $6, updated_at = CURRENT_TIMESTAMP
             WHERE transportation_id = $7 RETURNING *`,
            [transportation_name, contact_number, address, gst_number, remark, is_active, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Transportation not found' });
        }

        res.json({ success: true, data: result.rows[0], message: 'Transportation updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE transportation (soft delete)
router.delete('/transportations/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'UPDATE transportations SET is_active = false WHERE transportation_id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Transportation not found' });
        }

        res.json({ success: true, message: 'Transportation deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;

