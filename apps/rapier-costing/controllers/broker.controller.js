// ================================================
// Broker Controller
// ================================================

const Broker = require('../models/Broker');

exports.getAllBrokers = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;
        
        const brokers = await Broker.findAndCountAll({
            where: { userId: req.user.id },
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['brokerName', 'ASC']]
        });
        
        res.json({
            success: true,
            data: brokers.rows,
            pagination: {
                total: brokers.count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(brokers.count / limit)
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching brokers',
            error: error.message
        });
    }
};

exports.getBrokerById = async (req, res) => {
    try {
        const broker = await Broker.findOne({
            where: { id: req.params.id, userId: req.user.id }
        });
        
        if (!broker) {
            return res.status(404).json({
                success: false,
                message: 'Broker not found'
            });
        }
        
        res.json({ success: true, data: broker });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching broker',
            error: error.message
        });
    }
};

exports.createBroker = async (req, res) => {
    try {
        const broker = await Broker.create({
            ...req.body,
            userId: req.user.id
        });
        
        res.status(201).json({
            success: true,
            message: 'Broker created successfully',
            data: broker
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating broker',
            error: error.message
        });
    }
};

exports.updateBroker = async (req, res) => {
    try {
        const broker = await Broker.findOne({
            where: { id: req.params.id, userId: req.user.id }
        });
        
        if (!broker) {
            return res.status(404).json({
                success: false,
                message: 'Broker not found'
            });
        }
        
        await broker.update(req.body);
        
        res.json({
            success: true,
            message: 'Broker updated successfully',
            data: broker
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating broker',
            error: error.message
        });
    }
};

exports.deleteBroker = async (req, res) => {
    try {
        const broker = await Broker.findOne({
            where: { id: req.params.id, userId: req.user.id }
        });
        
        if (!broker) {
            return res.status(404).json({
                success: false,
                message: 'Broker not found'
            });
        }
        
        await broker.destroy();
        
        res.json({
            success: true,
            message: 'Broker deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting broker',
            error: error.message
        });
    }
};
