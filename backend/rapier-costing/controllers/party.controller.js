// ================================================
// Party Controller
// ================================================

const Party = require('../models/Party');

exports.getAllParties = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;
        
        const parties = await Party.findAndCountAll({
            where: { userId: req.user.id },
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['partyName', 'ASC']]
        });
        
        res.json({
            success: true,
            data: parties.rows,
            pagination: {
                total: parties.count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(parties.count / limit)
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching parties',
            error: error.message
        });
    }
};

exports.getPartyById = async (req, res) => {
    try {
        const party = await Party.findOne({
            where: { id: req.params.id, userId: req.user.id }
        });
        
        if (!party) {
            return res.status(404).json({
                success: false,
                message: 'Party not found'
            });
        }
        
        res.json({ success: true, data: party });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching party',
            error: error.message
        });
    }
};

exports.createParty = async (req, res) => {
    try {
        const party = await Party.create({
            ...req.body,
            userId: req.user.id
        });
        
        res.status(201).json({
            success: true,
            message: 'Party created successfully',
            data: party
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating party',
            error: error.message
        });
    }
};

exports.updateParty = async (req, res) => {
    try {
        const party = await Party.findOne({
            where: { id: req.params.id, userId: req.user.id }
        });
        
        if (!party) {
            return res.status(404).json({
                success: false,
                message: 'Party not found'
            });
        }
        
        await party.update(req.body);
        
        res.json({
            success: true,
            message: 'Party updated successfully',
            data: party
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating party',
            error: error.message
        });
    }
};

exports.deleteParty = async (req, res) => {
    try {
        const party = await Party.findOne({
            where: { id: req.params.id, userId: req.user.id }
        });
        
        if (!party) {
            return res.status(404).json({
                success: false,
                message: 'Party not found'
            });
        }
        
        await party.destroy();
        
        res.json({
            success: true,
            message: 'Party deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting party',
            error: error.message
        });
    }
};
