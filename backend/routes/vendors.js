const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// GET all vendors (with search)
router.get('/', async (req, res) => {
    try {
        const { search } = req.query;
        let query = `
            SELECT v.id, v.code, v.name, v.city, v.gstn, v.is_active, 
                   vg.name as group_name 
            FROM vendors v 
            LEFT JOIN vendor_groups vg ON v.vendor_group_id = vg.legacy_id 
            WHERE 1=1
        `;
        const params = [];

        if (search) {
            params.push(`%${search}%`);
            query += ` AND (v.name ILIKE $${params.length} OR v.code ILIKE $${params.length})`;
        }

        query += ' ORDER BY v.name ASC';

        const result = await pool.query(query, params);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching vendors:', error);
        res.status(500).json({ success: false, message: 'Error fetching vendors' });
    }
});

// GET single vendor
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM vendors WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Vendor not found' });
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error fetching vendor:', error);
        res.status(500).json({ success: false, message: 'Error fetching vendor' });
    }
});

// POST create vendor
router.post('/', async (req, res) => {
    try {
        const { code, name, vendor_group_id, address, city, pincode, state, gstn, is_active } = req.body;

        const result = await pool.query(
            `INSERT INTO vendors (code, name, vendor_group_id, address, city, pincode, state, gstn, is_active) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
             RETURNING *`,
            [code, name, vendor_group_id, address, city, pincode, state, gstn, is_active]
        );

        res.status(201).json({ success: true, data: result.rows[0], message: 'Vendor created successfully' });
    } catch (error) {
        console.error('Error creating vendor:', error);
        res.status(500).json({ success: false, message: 'Error creating vendor', error: error.message });
    }
});

// PUT update vendor
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { code, name, vendor_group_id, address, city, pincode, state, gstn, is_active } = req.body;

        const result = await pool.query(
            `UPDATE vendors 
             SET code=$1, name=$2, vendor_group_id=$3, address=$4, city=$5, pincode=$6, state=$7, gstn=$8, is_active=$9 
             WHERE id=$10 
             RETURNING *`,
            [code, name, vendor_group_id, address, city, pincode, state, gstn, is_active, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Vendor not found' });
        }

        res.json({ success: true, data: result.rows[0], message: 'Vendor updated successfully' });
    } catch (error) {
        console.error('Error updating vendor:', error);
        res.status(500).json({ success: false, message: 'Error updating vendor', error: error.message });
    }
});

// DELETE vendor
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM vendors WHERE id = $1 RETURNING id', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Vendor not found' });
        }

        res.json({ success: true, message: 'Vendor deleted successfully' });
    } catch (error) {
        console.error('Error deleting vendor:', error);
        res.status(500).json({ success: false, message: 'Error deleting vendor' });
    }
});

module.exports = router;
