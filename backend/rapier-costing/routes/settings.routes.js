// ================================================
// Settings Routes
// ================================================

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth.middleware');

router.use(authenticateToken);

router.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Get system settings'
    });
});

router.put('/', (req, res) => {
    res.json({
        success: true,
        message: 'Update settings'
    });
});

module.exports = router;
