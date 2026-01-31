// ================================================
// Validation Middleware
// ================================================

const { body, validationResult } = require('express-validator');

/**
 * Handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array()
        });
    }
    next();
};

/**
 * Validate costing sheet data
 */
exports.validateCosting = [
    body('orderLength')
        .isNumeric()
        .withMessage('Order length must be a number')
        .isFloat({ min: 0 })
        .withMessage('Order length must be positive'),
    
    body('warps')
        .optional()
        .isArray()
        .withMessage('Warps must be an array'),
    
    body('wefts')
        .optional()
        .isArray()
        .withMessage('Wefts must be an array'),
    
    handleValidationErrors
];

/**
 * Validate user registration
 */
exports.validateRegistration = [
    body('username')
        .trim()
        .isLength({ min: 3, max: 100 })
        .withMessage('Username must be 3-100 characters')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username can only contain letters, numbers, and underscores'),
    
    body('email')
        .trim()
        .isEmail()
        .normalizeEmail()
        .withMessage('Valid email required'),
    
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters'),
    
    handleValidationErrors
];

/**
 * Validate login
 */
exports.validateLogin = [
    body('email')
        .trim()
        .isEmail()
        .normalizeEmail()
        .withMessage('Valid email required'),
    
    body('password')
        .notEmpty()
        .withMessage('Password required'),
    
    handleValidationErrors
];

/**
 * Validate party data
 */
exports.validateParty = [
    body('partyName')
        .trim()
        .isLength({ min: 2, max: 200 })
        .withMessage('Party name must be 2-200 characters'),
    
    body('phone')
        .optional()
        .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/)
        .withMessage('Invalid phone number'),
    
    body('email')
        .optional()
        .isEmail()
        .withMessage('Invalid email'),
    
    handleValidationErrors
];

/**
 * Validate broker data
 */
exports.validateBroker = [
    body('brokerName')
        .trim()
        .isLength({ min: 2, max: 200 })
        .withMessage('Broker name must be 2-200 characters'),
    
    body('commissionPercentage')
        .optional()
        .isFloat({ min: 0, max: 100 })
        .withMessage('Commission must be between 0-100'),
    
    handleValidationErrors
];

module.exports = exports;
