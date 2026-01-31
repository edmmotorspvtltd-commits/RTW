// ================================================
// Models Index - Setup all relationships
// ================================================

const User = require('./User');
const Party = require('./Party');
const Broker = require('./Broker');
const CostingSheet = require('./CostingSheet');
const WarpConfiguration = require('./WarpConfiguration');
const WeftConfiguration = require('./WeftConfiguration');

// ================================================
// RELATIONSHIPS
// ================================================

// User relationships
User.hasMany(Party, { foreignKey: 'userId', as: 'parties' });
User.hasMany(Broker, { foreignKey: 'userId', as: 'brokers' });
User.hasMany(CostingSheet, { foreignKey: 'userId', as: 'costings' });

// Party relationships
Party.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Party.hasMany(CostingSheet, { foreignKey: 'partyId', as: 'costings' });

// Broker relationships
Broker.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Broker.hasMany(CostingSheet, { foreignKey: 'brokerId', as: 'costings' });

// CostingSheet relationships
CostingSheet.belongsTo(User, { foreignKey: 'userId', as: 'user' });
CostingSheet.belongsTo(Party, { foreignKey: 'partyId', as: 'party' });
CostingSheet.belongsTo(Broker, { foreignKey: 'brokerId', as: 'broker' });
CostingSheet.hasMany(WarpConfiguration, { foreignKey: 'costingSheetId', as: 'warps', onDelete: 'CASCADE' });
CostingSheet.hasMany(WeftConfiguration, { foreignKey: 'costingSheetId', as: 'wefts', onDelete: 'CASCADE' });

// WarpConfiguration relationships
WarpConfiguration.belongsTo(CostingSheet, { foreignKey: 'costingSheetId', as: 'costingSheet' });

// WeftConfiguration relationships
WeftConfiguration.belongsTo(CostingSheet, { foreignKey: 'costingSheetId', as: 'costingSheet' });

// ================================================
// EXPORT ALL MODELS
// ================================================

module.exports = {
    User,
    Party,
    Broker,
    CostingSheet,
    WarpConfiguration,
    WeftConfiguration
};
