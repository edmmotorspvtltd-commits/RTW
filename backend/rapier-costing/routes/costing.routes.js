// ================================================
// Costing Routes - Fixed route order
// ================================================

const express = require('express');
const router = express.Router();
const costingController = require('../controllers/costing.controller.simple'); // Use simplified controller
const templateController = require('../controllers/template.controller'); // Template controller
const helperController = require('../controllers/costing-helpers.controller'); // Helper functions
const { authenticateToken } = require('../../middleware/auth'); // Use main auth middleware
const { validateCosting } = require('../middleware/validation.middleware');

// Apply authentication to all routes
router.use(authenticateToken);

// ================================================
// COSTING CRUD OPERATIONS
// ================================================

/**
 * @route   GET /api/costing
 * @desc    Get all costing sheets for authenticated user
 * @access  Private
 */
router.get('/', costingController.getAllCostings);

// ================================================
// SPECIFIC ROUTES (must come BEFORE /:id)
// ================================================

/**
 * @route   GET /api/costing/generate-number
 * @desc    Generate next costing number
 * @access  Private
 */
router.get('/generate-number', helperController.generateCostingNumber);

/**
 * @route   GET /api/costing/parties
 * @desc    Get all parties for dropdown
 * @access  Private
 */
router.get('/parties', helperController.getParties);

/**
 * @route   GET /api/costing/agents
 * @desc    Get all agents/brokers for dropdown
 * @access  Private
 */
router.get('/agents', helperController.getAgents);

/**
 * @route   GET /api/costing/search
 * @desc    Search costing sheets
 * @access  Private
 */
router.get('/search', costingController.searchCostings);

/**
 * @route   GET /api/costing/filter
 * @desc    Filter costing sheets by criteria
 * @access  Private
 */
router.get('/filter', costingController.filterCostings);


/**
 * @route   POST /api/costing/calculate
 * @desc    Calculate costing without saving
 * @access  Private
 */
router.post('/calculate', costingController.calculateCosting);

// ================================================
// TEMPLATE ROUTES (must come BEFORE /:id routes)
// ================================================

/**
 * @route   GET /api/costing/templates
 * @desc    Get all costing templates
 * @access  Private
 */
router.get('/templates', templateController.getAllTemplates);

/**
 * @route   GET /api/costing/templates/:id
 * @desc    Get template by ID
 * @access  Private
 */
router.get('/templates/:id', templateController.getTemplateById);

/**
 * @route   POST /api/costing/templates
 * @desc    Create new template
 * @access  Private
 */
router.post('/templates', templateController.createTemplate);

/**
 * @route   PUT /api/costing/templates/:id
 * @desc    Update template
 * @access  Private
 */
router.put('/templates/:id', templateController.updateTemplate);

/**
 * @route   DELETE /api/costing/templates/:id
 * @desc    Delete template
 * @access  Private
 */
router.delete('/templates/:id', templateController.deleteTemplate);

// ================================================
// PARAMETERIZED ROUTES (must come AFTER specific routes)
// ================================================

/**
 * @route   GET /api/costing/:id
 * @desc    Get single costing sheet by ID
 * @access  Private
 */
router.get('/:id', costingController.getCostingById);

/**
 * @route   POST /api/costing
 * @desc    Create new costing sheet
 * @access  Private
 */
router.post('/', validateCosting, costingController.createCosting);

/**
 * @route   PUT /api/costing/:id
 * @desc    Update costing sheet
 * @access  Private
 */
router.put('/:id', validateCosting, costingController.updateCosting);

/**
 * @route   DELETE /api/costing/:id
 * @desc    Delete costing sheet
 * @access  Private
 */
router.delete('/:id', costingController.deleteCosting);

/**
 * @route   POST /api/costing/:id/recalculate
 * @desc    Recalculate existing costing sheet
 * @access  Private
 */
router.post('/:id/recalculate', costingController.recalculateCosting);

/**
 * @route   GET /api/costing/:id/export/pdf
 * @desc    Export costing sheet as PDF
 * @access  Private
 */
router.get('/:id/export/pdf', costingController.exportPDF);

/**
 * @route   GET /api/costing/:id/export/excel
 * @desc    Export costing sheet as Excel
 * @access  Private
 */
router.get('/:id/export/excel', costingController.exportExcel);

module.exports = router;
