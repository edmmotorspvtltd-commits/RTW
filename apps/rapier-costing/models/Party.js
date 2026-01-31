// ================================================
// Party Model
// ================================================

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Party = sequelize.define('Party', {
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
    partyName: {
        type: DataTypes.STRING(200),
        allowNull: false,
        field: 'party_name'
    },
    contactPerson: {
        type: DataTypes.STRING(200),
        field: 'contact_person'
    },
    phone: {
        type: DataTypes.STRING(20)
    },
    email: {
        type: DataTypes.STRING(200)
    },
    address: {
        type: DataTypes.TEXT
    },
    city: {
        type: DataTypes.STRING(100)
    },
    state: {
        type: DataTypes.STRING(100)
    },
    gstNumber: {
        type: DataTypes.STRING(50),
        field: 'gst_number'
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'is_active'
    }
}, {
    tableName: 'parties',
    timestamps: true
});

module.exports = Party;
