// Location Routes - Countries, States, Cities
const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// ========================================
// COUNTRIES ROUTES
// ========================================

// GET all countries (with search)
router.get('/countries', async (req, res) => {
    try {
        const { search } = req.query;
        let query = 'SELECT id, country_code, name FROM countries WHERE 1=1';
        const params = [];

        if (search) {
            params.push(`%${search}%`);
            query += ` AND name ILIKE $${params.length}`;
        }

        query += ' ORDER BY name ASC';

        const result = await pool.query(query, params);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching countries:', error);
        res.status(500).json({ success: false, message: 'Error fetching countries' });
    }
});

// GET single country by ID
router.get('/countries/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM countries WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Country not found' });
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error fetching country:', error);
        res.status(500).json({ success: false, message: 'Error fetching country' });
    }
});

// ========================================
// STATES ROUTES
// ========================================

// GET states (filter by country_id, with search)
router.get('/states', async (req, res) => {
    try {
        const { country_id, search } = req.query;
        let query = 'SELECT s.id, s.name, s.country_id, c.name as country_name FROM states s LEFT JOIN countries c ON s.country_id = c.id WHERE 1=1';
        const params = [];

        if (country_id) {
            params.push(country_id);
            query += ` AND s.country_id = $${params.length}`;
        }

        if (search) {
            params.push(`%${search}%`);
            query += ` AND s.name ILIKE $${params.length}`;
        }

        query += ' ORDER BY s.name ASC';

        const result = await pool.query(query, params);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching states:', error);
        res.status(500).json({ success: false, message: 'Error fetching states' });
    }
});

// GET single state by ID
router.get('/states/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'SELECT s.*, c.name as country_name FROM states s LEFT JOIN countries c ON s.country_id = c.id WHERE s.id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'State not found' });
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error fetching state:', error);
        res.status(500).json({ success: false, message: 'Error fetching state' });
    }
});

// ========================================
// CITIES ROUTES
// ========================================

// GET cities (filter by state_id, with search)
router.get('/cities', async (req, res) => {
    try {
        const { state_id, search } = req.query;
        let query = 'SELECT c.id, c.city, c.state_id, s.name as state_name FROM cities c LEFT JOIN states s ON c.state_id = s.id WHERE 1=1';
        const params = [];

        if (state_id) {
            params.push(state_id);
            query += ` AND c.state_id = $${params.length}`;
        }

        if (search) {
            params.push(`%${search}%`);
            query += ` AND c.city ILIKE $${params.length}`;
        }

        query += ' ORDER BY c.city ASC';

        const result = await pool.query(query, params);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching cities:', error);
        res.status(500).json({ success: false, message: 'Error fetching cities' });
    }
});

// GET single city by ID
router.get('/cities/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'SELECT c.*, s.name as state_name FROM cities c LEFT JOIN states s ON c.state_id = s.id WHERE c.id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'City not found' });
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error fetching city:', error);
        res.status(500).json({ success: false, message: 'Error fetching city' });
    }
});

module.exports = router;
