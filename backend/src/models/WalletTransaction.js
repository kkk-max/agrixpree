const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('WalletTransaction', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    uuid: { type: DataTypes.CHAR(36), allowNull: false, unique: true },
    wallet_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    type: { type: DataTypes.ENUM('credit', 'debit'), allowNull: false },
    amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    balance_after: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    source: { type: DataTypes.ENUM('order_payment', 'order_received', 'deposit', 'withdrawal', 'refund', 'procurement_payment', 'admin_adjustment'), allowNull: false },
    reference_id: DataTypes.INTEGER.UNSIGNED,
    reference_type: DataTypes.STRING(50),
    description: DataTypes.STRING(500),
    status: { type: DataTypes.ENUM('pending', 'completed', 'failed'), defaultValue: 'completed' }
  }, { tableName: 'wallet_transactions', underscored: true, updatedAt: false });
};
