const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// Get all selvedges
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM selvedge_master ORDER BY id DESC');
        res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error('Error fetching selvedge:', err);
        res.status(500).json({ success: false, message: 'Server error: ' + err.message });
    }
});

// Add new selvedge
router.post('/', async (req, res) => {
    try {
        const { name, base_color, dents, selvedge_ends, width, ends_per_heald, text, text_color, ends_per_dent, extra_ends, weave } = req.body;
        const result = await pool.query(
            `INSERT INTO selvedge_master (name, base_color, dents, selvedge_ends, width, ends_per_heald, text, text_color, ends_per_dent, extra_ends, weave) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
            [name, base_color, dents, selvedge_ends, width, ends_per_heald, text, text_color, ends_per_dent, extra_ends, weave]
        );
        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        console.error('Error adding selvedge:', err);
        res.status(500).json({ success: false, message: 'Server error: ' + err.message });
    }
});

// Update selvedge
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, base_color, dents, selvedge_ends, width, ends_per_heald, text, text_color, ends_per_dent, extra_ends, weave, is_active } = req.body;
        const result = await pool.query(
            `UPDATE selvedge_master SET 
                name = $1, base_color = $2, dents = $3, selvedge_ends = $4, width = $5, 
                ends_per_heald = $6, text = $7, text_color = $8, ends_per_dent = $9, 
                extra_ends = $10, weave = $11, is_active = $12, updated_at = CURRENT_TIMESTAMP 
             WHERE id = $13 RETURNING *`,
            [name, base_color, dents, selvedge_ends, width, ends_per_heald, text, text_color, ends_per_dent, extra_ends, weave, is_active, id]
        );
        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        console.error('Error updating selvedge:', err);
        res.status(500).json({ success: false, message: 'Server error: ' + err.message });
    }
});

// Delete selvedge
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM selvedge_master WHERE id = $1', [id]);
        res.json({ success: true, message: 'Deleted successfully' });
    } catch (err) {
        console.error('Error deleting selvedge:', err);
        res.status(500).json({ success: false, message: 'Server error: ' + err.message });
    }
});

module.exports = router;
