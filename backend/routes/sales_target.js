const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// Get all targets
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM sales_order_target ORDER BY id DESC');
        res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error('Error fetching sales targets:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Add new target
router.post('/', async (req, res) => {
    try {
        const { target_year, export_target, domestic_grey_target, domestic_finish_target, two_months_target } = req.body;
        const result = await pool.query(
            'INSERT INTO sales_order_target (target_year, export_target, domestic_grey_target, domestic_finish_target, two_months_target) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [target_year, export_target || 0, domestic_grey_target || 0, domestic_finish_target || 0, two_months_target || 0]
        );
        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        console.error('Error adding sales target:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Update target
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { target_year, export_target, domestic_grey_target, domestic_finish_target, two_months_target, is_active } = req.body;
        const result = await pool.query(
            'UPDATE sales_order_target SET target_year = $1, export_target = $2, domestic_grey_target = $3, domestic_finish_target = $4, two_months_target = $5, is_active = $6, updated_at = CURRENT_TIMESTAMP WHERE id = $7 RETURNING *',
            [target_year, export_target, domestic_grey_target, domestic_finish_target, two_months_target, is_active, id]
        );
        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        console.error('Error updating sales target:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Delete target
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM sales_order_target WHERE id = $1', [id]);
        res.json({ success: true, message: 'Deleted successfully' });
    } catch (err) {
        console.error('Error deleting sales target:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
