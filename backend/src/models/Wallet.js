const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Wallet', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, unique: true },
    balance: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0.00 },
    currency: { type: DataTypes.STRING(3), defaultValue: 'INR' },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true }
  }, { tableName: 'wallets', underscored: true });
};
