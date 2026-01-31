// ================================================================================
// UNITS ROUTES - RTWE ERP
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

// GET: Fetch all units
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT u.*, c.company_name, c.company_code
            FROM units u
            LEFT JOIN companies c ON u.company_id = c.id
            WHERE u.deleted_at IS NULL
            ORDER BY u.created_at DESC
        `);

        res.json({ success: true, units: result.rows });
    } catch (error) {
        console.error('Error fetching units:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET: Fetch units by company ID
router.get('/by-company/:companyId', isAuthenticated, async (req, res) => {
    try {
        const { companyId } = req.params;
        const result = await pool.query(`
            SELECT * FROM units 
            WHERE company_id = $1 AND deleted_at IS NULL
            ORDER BY created_at DESC
        `, [companyId]);

        res.json({ success: true, units: result.rows });
    } catch (error) {
        console.error('Error fetching units:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET: Fetch unit by ID
router.get('/:id', isAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(`
            SELECT u.*, c.company_name, c.company_code
            FROM units u
            LEFT JOIN companies c ON u.company_id = c.id
            WHERE u.id = $1 AND u.deleted_at IS NULL
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Unit not found' });
        }

        res.json({ success: true, unit: result.rows[0] });
    } catch (error) {
        console.error('Error fetching unit:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST: Create new unit
router.post('/create', isAuthenticated, async (req, res) => {
    try {
        const {
            companyId, unitName, unitCode, unitType, location,
            addressLine1, addressLine2, city, state, pincode,
            managerName, managerEmail, managerPhone,
            productionCapacity, maxEmployees, status
        } = req.body;

        const result = await pool.query(`
            INSERT INTO units (
                company_id, unit_code, unit_name, unit_type, location,
                address_line1, address_line2, city, state, pincode,
                manager_name, manager_email, manager_phone,
                production_capacity, max_employees, status, created_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
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
            UPDATE units SET ${setClause} WHERE id = $1 AND deleted_at IS NULL RETURNING *
        `, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Unit not found' });
        }

        res.json({ success: true, message: 'Unit updated successfully', unit: result.rows[0] });
    } catch (error) {
        console.error('Error updating unit:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE: Soft delete unit
router.delete('/:id', isAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(`
            UPDATE units SET deleted_at = CURRENT_TIMESTAMP, updated_by = $2
            WHERE id = $1 AND deleted_at IS NULL RETURNING id
        `, [id, req.session.userId]);

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
