// ================================================
// Party Routes
// ================================================

const express = require('express');
const router = express.Router();
const partyController = require('../controllers/party.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { validateParty } = require('../middleware/validation.middleware');

// Apply authentication to all routes
router.use(authenticateToken);

/**
 * @route   GET /api/parties
 * @desc    Get all parties
 * @access  Private
 */
router.get('/', partyController.getAllParties);

/**
 * @route   GET /api/parties/:id
 * @desc    Get party by ID
 * @access  Private
 */
router.get('/:id', partyController.getPartyById);

/**
 * @route   POST /api/parties
 * @desc    Create new party
 * @access  Private
 */
router.post('/', validateParty, partyController.createParty);

/**
 * @route   PUT /api/parties/:id
 * @desc    Update party
 * @access  Private
 */
router.put('/:id', validateParty, partyController.updateParty);

/**
 * @route   DELETE /api/parties/:id
 * @desc    Delete party
 * @access  Private
 */
router.delete('/:id', partyController.deleteParty);

module.exports = router;
