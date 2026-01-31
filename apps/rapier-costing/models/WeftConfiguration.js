// ================================================
// Weft Configuration Model
// ================================================

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const WeftConfiguration = sequelize.define('WeftConfiguration', {
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
    costingSheetId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'costing_sheet_id'
    },
    weftIndex: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'weft_index'
    },
    
    // Input Parameters
    rs: {
        type: DataTypes.DECIMAL(10, 2)
    },
    pick: {
        type: DataTypes.INTEGER
    },
    insertion: {
        type: DataTypes.DECIMAL(10, 2)
    },
    weftCount: {
        type: DataTypes.DECIMAL(10, 2),
        field: 'weft_count'
    },
    rateOfYarn: {
        type: DataTypes.DECIMAL(10, 2),
        field: 'rate_of_yarn'
    },
    percentageOfTotalWeft: {
        type: DataTypes.DECIMAL(5, 2),
        field: 'percentage_of_total_weft'
    },
    
    // Yarn Details
    denier: {
        type: DataTypes.DECIMAL(10, 2)
    },
    cottonRate: {
        type: DataTypes.DECIMAL(10, 2),
        field: 'cotton_rate'
    },
    
    // Calculated Results
    weftConsumption: {
        type: DataTypes.DECIMAL(10, 7),
        field: 'weft_consumption'
    },
    weftWastage: {
        type: DataTypes.DECIMAL(10, 7),
        field: 'weft_wastage'
    },
    totalWeftGlm: {
        type: DataTypes.DECIMAL(10, 7),
        field: 'total_weft_glm'
    },
    costPerMeter: {
        type: DataTypes.DECIMAL(10, 2),
        field: 'cost_per_meter'
    },
    costPerTaga: {
        type: DataTypes.DECIMAL(10, 2),
        field: 'cost_per_taga'
    },
    yarnRequiredKgs: {
        type: DataTypes.DECIMAL(10, 2),
        field: 'yarn_required_kgs'
    }
}, {
    tableName: 'weft_configurations',
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['costing_sheet_id', 'weft_index']
        }
    ]
});

module.exports = WeftConfiguration;
