const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// GET all
router.get('/', async (req, res) => {
    try {
        const { search } = req.query;
        let query = 'SELECT * FROM vendor_prefixes WHERE 1=1';
        const params = [];
        if (search) {
            params.push(`%${search}%`);
            query += ` AND prefix ILIKE $${params.length}`;
        }
        query += ' ORDER BY prefix ASC';
        const result = await pool.query(query, params);
        res.json({ success: true, data: result.rows });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Error fetching prefixes' });
    }
});

// POST
router.post('/', async (req, res) => {
    try {
        const { prefix, is_active } = req.body;
        const result = await pool.query(
            'INSERT INTO vendor_prefixes (prefix, is_active) VALUES ($1, $2) RETURNING *',
            [prefix, is_active]
        );
        res.status(201).json({ success: true, data: result.rows[0], message: 'Prefix created' });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Error creating prefix' });
    }
});

// PUT
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { prefix, is_active } = req.body;
        const result = await pool.query(
            'UPDATE vendor_prefixes SET prefix=$1, is_active=$2 WHERE id=$3 RETURNING *',
            [prefix, is_active, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Not found' });
        res.json({ success: true, data: result.rows[0], message: 'Prefix updated' });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Error updating prefix' });
    }
});

// DELETE
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM vendor_prefixes WHERE id=$1 RETURNING id', [id]);
        if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Not found' });
        res.json({ success: true, message: 'Prefix deleted' });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Error deleting prefix' });
    }
});

module.exports = router;
