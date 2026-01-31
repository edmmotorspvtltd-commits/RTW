// ================================================
// Template Routes
// ================================================

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth.middleware');

router.use(authenticateToken);

router.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Get all templates'
    });
});

router.post('/', (req, res) => {
    res.json({
        success: true,
        message: 'Create template'
    });
});

router.get('/:id', (req, res) => {
    res.json({
        success: true,
        message: 'Get template by ID'
    });
});

router.delete('/:id', (req, res) => {
    res.json({
        success: true,
        message: 'Delete template'
    });
});

module.exports = router;
