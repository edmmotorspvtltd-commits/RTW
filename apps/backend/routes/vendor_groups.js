const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// GET all groups (with search)
router.get('/', async (req, res) => {
    try {
        const { search } = req.query;
        let query = 'SELECT id, legacy_id, name, group_type_id FROM vendor_groups WHERE 1=1';
        const params = [];

        if (search) {
            params.push(`%${search}%`);
            query += ` AND name ILIKE $${params.length}`;
        }

        query += ' ORDER BY name ASC';
        const result = await pool.query(query, params);

        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error fetching groups:', error);
        res.status(500).json({ success: false, message: 'Error fetching vendor groups' });
    }
});

// GET single group
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM vendor_groups WHERE id = $1', [id]);
        if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Group not found' });
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching group' });
    }
});

// POST create group
router.post('/', async (req, res) => {
    try {
        const { name, group_type_id } = req.body;
        // Generate a pseudo legacy_id if not provided (max + 1)
        const legacyRes = await pool.query('SELECT MAX(legacy_id) as max_id FROM vendor_groups');
        const legacy_id = (legacyRes.rows[0].max_id || 10000) + 1;

        const result = await pool.query(
            'INSERT INTO vendor_groups (name, group_type_id, legacy_id) VALUES ($1, $2, $3) RETURNING *',
            [name, group_type_id, legacy_id]
        );
        res.status(201).json({ success: true, data: result.rows[0], message: 'Group created' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error creating group', error: error.message });
    }
});

// PUT update group
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, group_type_id } = req.body;
        const result = await pool.query(
            'UPDATE vendor_groups SET name=$1, group_type_id=$2 WHERE id=$3 RETURNING *',
            [name, group_type_id, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Group not found' });
        res.json({ success: true, data: result.rows[0], message: 'Group updated' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating group', error: error.message });
    }
});

// DELETE
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM vendor_groups WHERE id = $1 RETURNING id', [id]);
        if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Group not found' });
        res.json({ success: true, message: 'Group deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting group' });
    }
});

module.exports = router;
