const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Notification', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    type: { type: DataTypes.ENUM('order', 'kyc', 'wallet', 'system', 'stock', 'procurement', 'chat'), allowNull: false },
    title: { type: DataTypes.STRING(200), allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: false },
    is_read: { type: DataTypes.BOOLEAN, defaultValue: false },
    reference_id: DataTypes.INTEGER.UNSIGNED,
    reference_type: DataTypes.STRING(50)
  }, { tableName: 'notifications', underscored: true, updatedAt: false });
};
