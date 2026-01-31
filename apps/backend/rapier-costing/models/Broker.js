// ================================================
// Broker Model
// ================================================

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Broker = sequelize.define('Broker', {
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
    brokerName: {
        type: DataTypes.STRING(200),
        allowNull: false,
        field: 'broker_name'
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
    commissionPercentage: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 1.00,
        field: 'commission_percentage'
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'is_active'
    }
}, {
    tableName: 'brokers',
    timestamps: true
});

module.exports = Broker;
