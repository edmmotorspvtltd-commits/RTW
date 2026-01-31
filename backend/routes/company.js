// ================================================================================
// COMPANY ROUTES - RTWE ERP
// ================================================================================

const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.userId) {
        return next();
    }
    res.status(401).json({ success: false, message: 'Unauthorized' });
};

// GET: Fetch all companies
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT id, company_code, company_name, company_type, owner_name,
                   owner_email, owner_phone, city, state, gst_number, pan_number,
                   status, created_at
            FROM companies
            WHERE deleted_at IS NULL
            ORDER BY created_at DESC
        `);

        res.json({ success: true, companies: result.rows });
    } catch (error) {
        console.error('Error fetching companies:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET: Fetch company by ID
router.get('/:id', isAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(`
            SELECT * FROM companies WHERE id = $1 AND deleted_at IS NULL
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Company not found' });
        }

        res.json({ success: true, company: result.rows[0] });
    } catch (error) {
        console.error('Error fetching company:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST: Create new company
router.post('/create', isAuthenticated, async (req, res) => {
    try {
        const {
            companyName, companyCode, companyType, ownerName, ownerEmail, ownerPhone,
            alternatePhone, addressLine1, addressLine2, city, state, pincode,
            gstNumber, panNumber, tanNumber, cinNumber, registrationDate, status, notes
        } = req.body;

        const result = await pool.query(`
            INSERT INTO companies (
                company_code, company_name, company_type, owner_name, owner_email, owner_phone,
                alternate_phone, address_line1, address_line2, city, state, pincode,
                gst_number, pan_number, tan_number, cin_number, registration_date, status, notes,
                created_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
            RETURNING *
        `, [
            companyCode, companyName, companyType, ownerName, ownerEmail, ownerPhone,
            alternatePhone, addressLine1, addressLine2, city, state, pincode,
            gstNumber, panNumber, tanNumber, cinNumber, registrationDate, status, notes,
            req.session.userId
        ]);

        res.json({ success: true, message: 'Company created successfully', company: result.rows[0] });
    } catch (error) {
        console.error('Error creating company:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// PUT: Update company
router.put('/:id', isAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        const updateFields = req.body;
        updateFields.updated_by = req.session.userId;

        const setClause = Object.keys(updateFields)
            .map((key, index) => `${key} = $${index + 2}`)
            .join(', ');

        const values = [id, ...Object.values(updateFields)];

        const result = await pool.query(`
            UPDATE companies SET ${setClause} WHERE id = $1 AND deleted_at IS NULL RETURNING *
        `, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Company not found' });
        }

        res.json({ success: true, message: 'Company updated successfully', company: result.rows[0] });
    } catch (error) {
        console.error('Error updating company:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE: Soft delete company
router.delete('/:id', isAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(`
            UPDATE companies SET deleted_at = CURRENT_TIMESTAMP, updated_by = $2
            WHERE id = $1 AND deleted_at IS NULL RETURNING id
        `, [id, req.session.userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Company not found' });
        }

        res.json({ success: true, message: 'Company deleted successfully' });
    } catch (error) {
        console.error('Error deleting company:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// PATCH: Toggle company status
router.patch('/:id/status', isAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['active', 'inactive', 'suspended'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const result = await pool.query(`
            UPDATE companies SET status = $2, updated_by = $3, updated_at = CURRENT_TIMESTAMP
            WHERE id = $1 AND deleted_at IS NULL RETURNING *
        `, [id, status, req.session.userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Company not found' });
        }

        res.json({ success: true, message: `Company marked as ${status}`, company: result.rows[0] });
    } catch (error) {
        console.error('Error updating company status:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ================================================================================
// UNITS ROUTES
// ================================================================================

// GET: Fetch all units for a company
router.get('/:companyId/units', isAuthenticated, async (req, res) => {
    try {
        const { companyId } = req.params;
        const result = await pool.query(`
            SELECT id, unit_code, unit_name, unit_type, location, city, state,
                   manager_name, manager_phone, is_active, status, created_at
            FROM units
            WHERE company_id = $1 AND deleted_at IS NULL
            ORDER BY created_at DESC
        `, [companyId]);

        res.json({ success: true, units: result.rows });
    } catch (error) {
        console.error('Error fetching units:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET: Fetch single unit
router.get('/units/:unitId', isAuthenticated, async (req, res) => {
    try {
        const { unitId } = req.params;
        const result = await pool.query(`
            SELECT u.*, c.company_name 
            FROM units u 
            LEFT JOIN companies c ON u.company_id = c.id
            WHERE u.id = $1 AND u.deleted_at IS NULL
        `, [unitId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Unit not found' });
        }

        res.json({ success: true, unit: result.rows[0] });
    } catch (error) {
        console.error('Error fetching unit:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST: Create unit for company
router.post('/:companyId/units', isAuthenticated, async (req, res) => {
    try {
        const { companyId } = req.params;
        const {
            unitCode, unitName, unitType, location,
            addressLine1, addressLine2, city, state, pincode,
            managerName, managerEmail, managerPhone,
            productionCapacity, maxEmployees, status
        } = req.body;

        const result = await pool.query(`
            INSERT INTO units (
                company_id, unit_code, unit_name, unit_type, location,
                address_line1, address_line2, city, state, pincode,
                manager_name, manager_email, manager_phone,
                production_capacity, max_employees, status, is_active, created_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, true, $17)
            RETURNING *
        `, [
            companyId, unitCode, unitName, unitType, location,
            addressLine1, addressLine2, city, state, pincode,
            managerName, managerEmail, managerPhone,
            productionCapacity, maxEmployees, status || 'active',
            req.session.userId
        ]);

        res.json({ success: true, message: 'Unit created successfully', unit: result.rows[0] });
    } catch (error) {
        console.error('Error creating unit:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// PUT: Update unit
router.put('/units/:unitId', isAuthenticated, async (req, res) => {
    try {
        const { unitId } = req.params;
        const {
            unitName, unitType, location,
            addressLine1, addressLine2, city, state, pincode,
            managerName, managerEmail, managerPhone,
            productionCapacity, maxEmployees, status
        } = req.body;

        const result = await pool.query(`
            UPDATE units SET
                unit_name = $2, unit_type = $3, location = $4,
                address_line1 = $5, address_line2 = $6, city = $7, state = $8, pincode = $9,
                manager_name = $10, manager_email = $11, manager_phone = $12,
                production_capacity = $13, max_employees = $14, status = $15,
                updated_by = $16, updated_at = CURRENT_TIMESTAMP
            WHERE id = $1 AND deleted_at IS NULL
            RETURNING *
        `, [
            unitId, unitName, unitType, location,
            addressLine1, addressLine2, city, state, pincode,
            managerName, managerEmail, managerPhone,
            productionCapacity, maxEmployees, status,
            req.session.userId
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Unit not found' });
        }

        res.json({ success: true, message: 'Unit updated successfully', unit: result.rows[0] });
    } catch (error) {
        console.error('Error updating unit:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// PATCH: Toggle unit status
router.patch('/units/:unitId/status', isAuthenticated, async (req, res) => {
    try {
        const { unitId } = req.params;
        const { status, isActive } = req.body;

        let query, params;
        if (status !== undefined) {
            query = `UPDATE units SET status = $2, updated_by = $3, updated_at = CURRENT_TIMESTAMP
                     WHERE id = $1 AND deleted_at IS NULL RETURNING *`;
            params = [unitId, status, req.session.userId];
        } else if (isActive !== undefined) {
            query = `UPDATE units SET is_active = $2, updated_by = $3, updated_at = CURRENT_TIMESTAMP
                     WHERE id = $1 AND deleted_at IS NULL RETURNING *`;
            params = [unitId, isActive, req.session.userId];
        } else {
            return res.status(400).json({ success: false, message: 'Provide status or isActive' });
        }

        const result = await pool.query(query, params);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Unit not found' });
        }

        res.json({ success: true, message: 'Unit status updated', unit: result.rows[0] });
    } catch (error) {
        console.error('Error updating unit status:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE: Soft delete unit
router.delete('/units/:unitId', isAuthenticated, async (req, res) => {
    try {
        const { unitId } = req.params;

        const result = await pool.query(`
            UPDATE units SET deleted_at = CURRENT_TIMESTAMP, updated_by = $2
            WHERE id = $1 AND deleted_at IS NULL RETURNING id
        `, [unitId, req.session.userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Unit not found' });
        }

        res.json({ success: true, message: 'Unit deleted successfully' });
    } catch (error) {
        console.error('Error deleting unit:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
