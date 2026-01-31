const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// Get all rates
router.get('/', async (req, res) => {
    try {
        // In future join with sort_master when table exists
        const result = await pool.query('SELECT * FROM rate_master ORDER BY id DESC');
        res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Add new rate
router.post('/', async (req, res) => {
    try {
        const { sort_master_id, rate_type, rate } = req.body;
        const result = await pool.query(
            'INSERT INTO rate_master (sort_master_id, rate_type, rate) VALUES ($1, $2, $3) RETURNING *',
            [sort_master_id, rate_type, rate]
        );
        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Update rate
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { sort_master_id, rate_type, rate, is_active } = req.body;
        const result = await pool.query(
            'UPDATE rate_master SET sort_master_id = $1, rate_type = $2, rate = $3, is_active = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *',
            [sort_master_id, rate_type, rate, is_active, id]
        );
        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Delete rate
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM rate_master WHERE id = $1', [id]);
        res.json({ success: true, message: 'Deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
