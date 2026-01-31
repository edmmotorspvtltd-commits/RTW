// ================================================
// Broker Routes
// ================================================

const express = require('express');
const router = express.Router();
const brokerController = require('../controllers/broker.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { validateBroker } = require('../middleware/validation.middleware');

router.use(authenticateToken);

router.get('/', brokerController.getAllBrokers);
router.get('/:id', brokerController.getBrokerById);
router.post('/', validateBroker, brokerController.createBroker);
router.put('/:id', validateBroker, brokerController.updateBroker);
router.delete('/:id', brokerController.deleteBroker);

module.exports = router;
