const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// GET all entries
router.get('/', async (req, res) => {
    try {
        const { search } = req.query;
        let query = 'SELECT * FROM yarn_adjust_entries WHERE 1=1';
        const params = [];
        if (search) {
            params.push(`%${search}%`);
            query += ` AND (yarn_name ILIKE $${params.length} OR mill_names_list ILIKE $${params.length})`;
        }
        query += ' ORDER BY id DESC';
        const result = await pool.query(query, params);
        res.json({ success: true, data: result.rows });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Error fetching adjustments' });
    }
});

// POST
router.post('/', async (req, res) => {
    try {
        const { yarn_name, mill_names_list, location_names_list, stock_type_names_list, quantity } = req.body;
        const result = await pool.query(
            `INSERT INTO yarn_adjust_entries 
             (yarn_name, mill_names_list, location_names_list, stock_type_names_list, quantity) 
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [yarn_name, mill_names_list, location_names_list, stock_type_names_list, quantity]
        );
        res.status(201).json({ success: true, data: result.rows[0], message: 'Adjustment created' });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Error creating adjustment' });
    }
});

// PUT
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { yarn_name, mill_names_list, location_names_list, stock_type_names_list, quantity } = req.body;
        const result = await pool.query(
            `UPDATE yarn_adjust_entries 
             SET yarn_name=$1, mill_names_list=$2, location_names_list=$3, stock_type_names_list=$4, quantity=$5 
             WHERE id=$6 RETURNING *`,
            [yarn_name, mill_names_list, location_names_list, stock_type_names_list, quantity, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Not found' });
        res.json({ success: true, data: result.rows[0], message: 'Adjustment updated' });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Error updating adjustment' });
    }
});

// DELETE
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM yarn_adjust_entries WHERE id=$1 RETURNING id', [id]);
        if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Not found' });
        res.json({ success: true, message: 'Adjustment deleted' });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Error deleting adjustment' });
    }
});

module.exports = router;
