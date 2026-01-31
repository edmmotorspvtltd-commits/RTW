// ================================================
// User Model
// ================================================

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcrypt');

const User = sequelize.define('User', {
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
    username: {
        type: DataTypes.STRING(100),
        unique: true,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING(200),
        unique: true,
        allowNull: false,
        validate: {
            isEmail: true
        }
    },
    passwordHash: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'password_hash'
    },
    fullName: {
        type: DataTypes.STRING(200),
        field: 'full_name'
    },
    companyName: {
        type: DataTypes.STRING(200),
        field: 'company_name'
    },
    phone: {
        type: DataTypes.STRING(20)
    },
    role: {
        type: DataTypes.STRING(50),
        defaultValue: 'user'
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'is_active'
    },
    lastLogin: {
        type: DataTypes.DATE,
        field: 'last_login'
    }
}, {
    tableName: 'users',
    timestamps: true
});

// Hash password before saving
User.beforeCreate(async (user) => {
    if (user.passwordHash) {
        const salt = await bcrypt.genSalt(10);
        user.passwordHash = await bcrypt.hash(user.passwordHash, salt);
    }
});

// Method to compare password
User.prototype.comparePassword = async function(password) {
    return await bcrypt.compare(password, this.passwordHash);
};

// Method to get public data (exclude sensitive fields)
User.prototype.toPublicJSON = function() {
    const values = { ...this.get() };
    delete values.passwordHash;
    return values;
};

module.exports = User;
