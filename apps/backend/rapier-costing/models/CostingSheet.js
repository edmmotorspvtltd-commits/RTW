// ================================================
// Costing Sheet Model
// ================================================

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CostingSheet = sequelize.define('CostingSheet', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    uuid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        unique: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'user_id'
    },
    
    // Order Information
    orderNumber: {
        type: DataTypes.STRING(100),
        field: 'order_number'
    },
    orderLength: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        field: 'order_length'
    },
    partyId: {
        type: DataTypes.INTEGER,
        field: 'party_id'
    },
    partyName: {
        type: DataTypes.STRING(200),
        field: 'party_name'
    },
    brokerId: {
        type: DataTypes.INTEGER,
        field: 'broker_id'
    },
    brokerName: {
        type: DataTypes.STRING(200),
        field: 'broker_name'
    },
    qualityType: {
        type: DataTypes.STRING(200),
        field: 'quality_type'
    },
    sizingSetNo: {
        type: DataTypes.STRING(100),
        field: 'sizing_set_no'
    },
    
    // Pricing & Results
    productionCostPerMtr: {
        type: DataTypes.DECIMAL(10, 2),
        field: 'production_cost_per_mtr'
    },
    productionCostPerTaga: {
        type: DataTypes.DECIMAL(10, 2),
        field: 'production_cost_per_taga'
    },
    minimumSellingPrice: {
        type: DataTypes.DECIMAL(10, 2),
        field: 'minimum_selling_price'
    },
    sellingPrice: {
        type: DataTypes.DECIMAL(10, 2),
        field: 'selling_price'
    },
    netProfitPerMtr: {
        type: DataTypes.DECIMAL(10, 2),
        field: 'net_profit_per_mtr'
    },
    netProfitTotal: {
        type: DataTypes.DECIMAL(12, 2),
        field: 'net_profit_total'
    },
    profitPercentage: {
        type: DataTypes.DECIMAL(5, 2),
        field: 'profit_percentage'
    },
    
    // Weight Summary
    totalWarpGlm: {
        type: DataTypes.DECIMAL(10, 4),
        field: 'total_warp_glm'
    },
    totalWeftGlm: {
        type: DataTypes.DECIMAL(10, 4),
        field: 'total_weft_glm'
    },
    glmPerMeter: {
        type: DataTypes.DECIMAL(10, 4),
        field: 'glm_per_meter'
    },
    gsmPerMeter: {
        type: DataTypes.DECIMAL(10, 4),
        field: 'gsm_per_meter'
    },
    
    // Job Charges
    jobRatePercentage: {
        type: DataTypes.DECIMAL(5, 2),
        field: 'job_rate_percentage'
    },
    jobChargesPerMtr: {
        type: DataTypes.DECIMAL(10, 2),
        field: 'job_charges_per_mtr'
    },
    jobChargesPerPick: {
        type: DataTypes.DECIMAL(10, 4),
        field: 'job_charges_per_pick'
    },
    pickValue: {
        type: DataTypes.INTEGER,
        field: 'pick_value'
    },
    
    // Percentages
    expensesPercentage: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 5.00,
        field: 'expenses_percentage'
    },
    brokeragePercentage: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 1.00,
        field: 'brokerage_percentage'
    },
    vatavPercentage: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 0.00,
        field: 'vatav_percentage'
    },
    
    // Status & Metadata
    status: {
        type: DataTypes.STRING(50),
        defaultValue: 'draft'
    },
    isTemplate: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_template'
    },
    templateName: {
        type: DataTypes.STRING(200),
        field: 'template_name'
    },
    notes: {
        type: DataTypes.TEXT
    },
    calculatedAt: {
        type: DataTypes.DATE,
        field: 'calculated_at'
    }
}, {
    tableName: 'costing_sheets',
    timestamps: true
});

module.exports = CostingSheet;
