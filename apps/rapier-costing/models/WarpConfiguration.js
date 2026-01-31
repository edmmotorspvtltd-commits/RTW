// ================================================
// Warp Configuration Model
// ================================================

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const WarpConfiguration = sequelize.define('WarpConfiguration', {
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
    warpIndex: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'warp_index'
    },
    
    // Input Parameters
    panna: {
        type: DataTypes.DECIMAL(10, 2)
    },
    rsGap: {
        type: DataTypes.DECIMAL(10, 2),
        field: 'rs_gap'
    },
    dbf: {
        type: DataTypes.DECIMAL(10, 2)
    },
    reed: {
        type: DataTypes.INTEGER
    },
    totalEnds: {
        type: DataTypes.INTEGER,
        field: 'total_ends'
    },
    warpCount: {
        type: DataTypes.DECIMAL(10, 2),
        field: 'warp_count'
    },
    rateOfYarn: {
        type: DataTypes.DECIMAL(10, 2),
        field: 'rate_of_yarn'
    },
    rateOfSizing: {
        type: DataTypes.DECIMAL(10, 2),
        field: 'rate_of_sizing'
    },
    crimping: {
        type: DataTypes.INTEGER,
        defaultValue: 103
    },
    
    // Beam Details
    noOfEndsInTopBeam: {
        type: DataTypes.INTEGER,
        field: 'no_of_ends_in_top_beam'
    },
    countOfTopBeam: {
        type: DataTypes.DECIMAL(10, 2),
        field: 'count_of_top_beam'
    },
    noOfEndsInBobin: {
        type: DataTypes.INTEGER,
        field: 'no_of_ends_in_bobin'
    },
    beamLength: {
        type: DataTypes.DECIMAL(10, 2),
        field: 'beam_length'
    },
    noOfCutsSizing: {
        type: DataTypes.INTEGER,
        field: 'no_of_cuts_sizing'
    },
    jariLength: {
        type: DataTypes.DECIMAL(10, 2),
        field: 'jari_length'
    },
    
    // Calculated Results
    warpGlm: {
        type: DataTypes.DECIMAL(10, 7),
        field: 'warp_glm'
    },
    warpGlmWithWastage: {
        type: DataTypes.DECIMAL(10, 7),
        field: 'warp_glm_with_wastage'
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
    },
    
    // Optional Charges
    topBeamCharges: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'top_beam_charges'
    },
    bobinCharges: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'bobin_charges'
    },
    topBeamAmount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.50,
        field: 'top_beam_amount'
    },
    bobinAmount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.50,
        field: 'bobin_amount'
    }
}, {
    tableName: 'warp_configurations',
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['costing_sheet_id', 'warp_index']
        }
    ]
});

module.exports = WarpConfiguration;
