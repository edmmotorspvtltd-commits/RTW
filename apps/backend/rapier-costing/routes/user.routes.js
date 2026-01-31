// ================================================
// User Routes
// ================================================

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth.middleware');

router.use(authenticateToken);

// Get user profile
router.get('/profile', (req, res) => {
    res.json({
        success: true,
        message: 'User profile endpoint'
    });
});

// Update user profile
router.put('/profile', (req, res) => {
    res.json({
        success: true,
        message: 'Update profile endpoint'
    });
});

module.exports = router;
