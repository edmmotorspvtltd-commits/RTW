// ================================================
// Costing Controller
// ================================================

const CostingSheet = require('../models/CostingSheet');
const WarpConfiguration = require('../models/WarpConfiguration');
const WeftConfiguration = require('../models/WeftConfiguration');
const CalculationService = require('../services/calculation.service');
const sequelize = require('../config/database');

// ================================================
// GET ALL COSTINGS
// ================================================

exports.getAllCostings = async (req, res) => {
    try {
        const { page = 1, limit = 20, status, sortBy = 'created_at', order = 'DESC' } = req.query;
        
        const offset = (page - 1) * limit;
        
        const whereClause = {
            userId: req.user.id
        };
        
        if (status) {
            whereClause.status = status;
        }
        
        const costings = await CostingSheet.findAndCountAll({
            where: whereClause,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [[sortBy, order]],
            include: [
                { model: WarpConfiguration, as: 'warps' },
                { model: WeftConfiguration, as: 'wefts' }
            ]
        });
        
        res.json({
            success: true,
            data: costings.rows,
            pagination: {
                total: costings.count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(costings.count / limit)
            }
        });
    } catch (error) {
        console.error('Get all costings error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching costing sheets',
            error: error.message
        });
    }
};

// ================================================
// GET COSTING BY ID
// ================================================

exports.getCostingById = async (req, res) => {
    try {
        const costing = await CostingSheet.findOne({
            where: {
                id: req.params.id,
                userId: req.user.id
            },
            include: [
                { model: WarpConfiguration, as: 'warps' },
                { model: WeftConfiguration, as: 'wefts' }
            ]
        });
        
        if (!costing) {
            return res.status(404).json({
                success: false,
                message: 'Costing sheet not found'
            });
        }
        
        res.json({
            success: true,
            data: costing
        });
    } catch (error) {
        console.error('Get costing by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching costing sheet',
            error: error.message
        });
    }
};

// ================================================
// CREATE COSTING
// ================================================

exports.createCosting = async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
        const { warps, wefts, ...costingData } = req.body;
        
        // Calculate before saving
        const calculations = CalculationService.calculateCompleteCost({
            ...costingData,
            warps: warps || [],
            wefts: wefts || []
        });
        
        // Create costing sheet
        const costing = await CostingSheet.create({
            ...costingData,
            userId: req.user.id,
            productionCostPerMtr: calculations.pricing.productionCost,
            minimumSellingPrice: calculations.pricing.minimumSellingPrice,
            netProfitPerMtr: calculations.pricing.netProfit,
            netProfitTotal: calculations.pricing.netProfitTotal,
            profitPercentage: calculations.pricing.profitPercentage,
            totalWarpGlm: calculations.totals.glmPerMeter,
            glmPerMeter: calculations.totals.glmPerMeter,
            gsmPerMeter: calculations.totals.gsmPerMeter,
            jobChargesPerPick: calculations.pricing.jobChargesPerPick,
            calculatedAt: new Date(),
            status: 'calculated'
        }, { transaction });
        
        // Create warp configurations
        if (warps && warps.length > 0) {
            for (let i = 0; i < warps.length; i++) {
                const warpCalc = calculations.warp[i];
                await WarpConfiguration.create({
                    ...warps[i],
                    costingSheetId: costing.id,
                    warpIndex: i + 1,
                    dbf: warpCalc.dbf,
                    totalEnds: warpCalc.totalEnds,
                    warpGlm: warpCalc.warpGLM,
                    costPerMeter: warpCalc.costPerMeter,
                    yarnRequiredKgs: warpCalc.yarnRequired
                }, { transaction });
            }
        }
        
        // Create weft configurations
        if (wefts && wefts.length > 0) {
            for (let i = 0; i < wefts.length; i++) {
                const weftCalc = calculations.weft[i];
                await WeftConfiguration.create({
                    ...wefts[i],
                    costingSheetId: costing.id,
                    weftIndex: i + 1,
                    weftConsumption: weftCalc.weftConsumption,
                    totalWeftGlm: weftCalc.totalWeftGLM,
                    costPerMeter: weftCalc.costPerMeter,
                    yarnRequiredKgs: weftCalc.yarnRequired
                }, { transaction });
            }
        }
        
        await transaction.commit();
        
        // Fetch complete costing with relationships
        const completeCost = await CostingSheet.findByPk(costing.id, {
            include: [
                { model: WarpConfiguration, as: 'warps' },
                { model: WeftConfiguration, as: 'wefts' }
            ]
        });
        
        res.status(201).json({
            success: true,
            message: 'Costing sheet created successfully',
            data: completeCost,
            calculations
        });
    } catch (error) {
        await transaction.rollback();
        console.error('Create costing error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating costing sheet',
            error: error.message
        });
    }
};

// ================================================
// UPDATE COSTING
// ================================================

exports.updateCosting = async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
        const costing = await CostingSheet.findOne({
            where: {
                id: req.params.id,
                userId: req.user.id
            }
        });
        
        if (!costing) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                message: 'Costing sheet not found'
            });
        }
        
        const { warps, wefts, ...costingData } = req.body;
        
        // Recalculate
        const calculations = CalculationService.calculateCompleteCost({
            ...costingData,
            warps: warps || [],
            wefts: wefts || []
        });
        
        // Update costing sheet
        await costing.update({
            ...costingData,
            productionCostPerMtr: calculations.pricing.productionCost,
            minimumSellingPrice: calculations.pricing.minimumSellingPrice,
            netProfitPerMtr: calculations.pricing.netProfit,
            netProfitTotal: calculations.pricing.netProfitTotal,
            profitPercentage: calculations.pricing.profitPercentage,
            totalWarpGlm: calculations.totals.glmPerMeter,
            glmPerMeter: calculations.totals.glmPerMeter,
            gsmPerMeter: calculations.totals.gsmPerMeter,
            jobChargesPerPick: calculations.pricing.jobChargesPerPick,
            calculatedAt: new Date()
        }, { transaction });
        
        // Delete existing warp/weft configurations
        await WarpConfiguration.destroy({
            where: { costingSheetId: costing.id },
            transaction
        });
        await WeftConfiguration.destroy({
            where: { costingSheetId: costing.id },
            transaction
        });
        
        // Create new warp configurations
        if (warps && warps.length > 0) {
            for (let i = 0; i < warps.length; i++) {
                const warpCalc = calculations.warp[i];
                await WarpConfiguration.create({
                    ...warps[i],
                    costingSheetId: costing.id,
                    warpIndex: i + 1,
                    dbf: warpCalc.dbf,
                    totalEnds: warpCalc.totalEnds,
                    warpGlm: warpCalc.warpGLM,
                    costPerMeter: warpCalc.costPerMeter,
                    yarnRequiredKgs: warpCalc.yarnRequired
                }, { transaction });
            }
        }
        
        // Create new weft configurations
        if (wefts && wefts.length > 0) {
            for (let i = 0; i < wefts.length; i++) {
                const weftCalc = calculations.weft[i];
                await WeftConfiguration.create({
                    ...wefts[i],
                    costingSheetId: costing.id,
                    weftIndex: i + 1,
                    weftConsumption: weftCalc.weftConsumption,
                    totalWeftGlm: weftCalc.totalWeftGLM,
                    costPerMeter: weftCalc.costPerMeter,
                    yarnRequiredKgs: weftCalc.yarnRequired
                }, { transaction });
            }
        }
        
        await transaction.commit();
        
        // Fetch updated costing
        const updatedCosting = await CostingSheet.findByPk(costing.id, {
            include: [
                { model: WarpConfiguration, as: 'warps' },
                { model: WeftConfiguration, as: 'wefts' }
            ]
        });
        
        res.json({
            success: true,
            message: 'Costing sheet updated successfully',
            data: updatedCosting,
            calculations
        });
    } catch (error) {
        await transaction.rollback();
        console.error('Update costing error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating costing sheet',
            error: error.message
        });
    }
};

// ================================================
// DELETE COSTING
// ================================================

exports.deleteCosting = async (req, res) => {
    try {
        const costing = await CostingSheet.findOne({
            where: {
                id: req.params.id,
                userId: req.user.id
            }
        });
        
        if (!costing) {
            return res.status(404).json({
                success: false,
                message: 'Costing sheet not found'
            });
        }
        
        await costing.destroy();
        
        res.json({
            success: true,
            message: 'Costing sheet deleted successfully'
        });
    } catch (error) {
        console.error('Delete costing error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting costing sheet',
            error: error.message
        });
    }
};

// ================================================
// CALCULATE COSTING (WITHOUT SAVING)
// ================================================

exports.calculateCosting = async (req, res) => {
    try {
        const { warps, wefts, ...costingData } = req.body;
        
        const calculations = CalculationService.calculateCompleteCost({
            ...costingData,
            warps: warps || [],
            wefts: wefts || []
        });
        
        res.json({
            success: true,
            message: 'Costing calculated successfully',
            data: calculations
        });
    } catch (error) {
        console.error('Calculate costing error:', error);
        res.status(500).json({
            success: false,
            message: 'Error calculating costing',
            error: error.message
        });
    }
};

// ================================================
// RECALCULATE EXISTING COSTING
// ================================================

exports.recalculateCosting = async (req, res) => {
    try {
        const costing = await CostingSheet.findOne({
            where: {
                id: req.params.id,
                userId: req.user.id
            },
            include: [
                { model: WarpConfiguration, as: 'warps' },
                { model: WeftConfiguration, as: 'wefts' }
            ]
        });
        
        if (!costing) {
            return res.status(404).json({
                success: false,
                message: 'Costing sheet not found'
            });
        }
        
        const calculations = CalculationService.calculateCompleteCost({
            orderLength: costing.orderLength,
            pickValue: costing.pickValue,
            jobRatePercentage: costing.jobRatePercentage,
            expensesPercentage: costing.expensesPercentage,
            brokeragePercentage: costing.brokeragePercentage,
            vatavPercentage: costing.vatavPercentage,
            sellingPrice: costing.sellingPrice,
            warps: costing.warps.map(w => w.toJSON()),
            wefts: costing.wefts.map(w => w.toJSON())
        });
        
        res.json({
            success: true,
            message: 'Costing recalculated successfully',
            data: calculations
        });
    } catch (error) {
        console.error('Recalculate costing error:', error);
        res.status(500).json({
            success: false,
            message: 'Error recalculating costing',
            error: error.message
        });
    }
};

// ================================================
// SEARCH COSTINGS
// ================================================

exports.searchCostings = async (req, res) => {
    try {
        const { query } = req.query;
        
        // Implement search logic here
        
        res.json({
            success: true,
            message: 'Search not yet implemented'
        });
    } catch (error) {
        console.error('Search costings error:', error);
        res.status(500).json({
            success: false,
            message: 'Error searching costing sheets',
            error: error.message
        });
    }
};

// ================================================
// FILTER COSTINGS
// ================================================

exports.filterCostings = async (req, res) => {
    try {
        // Implement filter logic here
        
        res.json({
            success: true,
            message: 'Filter not yet implemented'
        });
    } catch (error) {
        console.error('Filter costings error:', error);
        res.status(500).json({
            success: false,
            message: 'Error filtering costing sheets',
            error: error.message
        });
    }
};

// ================================================
// EXPORT PDF
// ================================================

exports.exportPDF = async (req, res) => {
    try {
        res.json({
            success: true,
            message: 'PDF export not yet implemented'
        });
    } catch (error) {
        console.error('Export PDF error:', error);
        res.status(500).json({
            success: false,
            message: 'Error exporting PDF',
            error: error.message
        });
    }
};

// ================================================
// EXPORT EXCEL
// ================================================

exports.exportExcel = async (req, res) => {
    try {
        res.json({
            success: true,
            message: 'Excel export not yet implemented'
        });
    } catch (error) {
        console.error('Export Excel error:', error);
        res.status(500).json({
            success: false,
            message: 'Error exporting Excel',
            error: error.message
        });
    }
};
