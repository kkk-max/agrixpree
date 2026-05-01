const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('OrderItem', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    order_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    product_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    product_name: { type: DataTypes.STRING(200), allowNull: false },
    unit: { type: DataTypes.STRING(20), allowNull: false },
    price_per_unit: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    quantity: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    total_price: { type: DataTypes.DECIMAL(12, 2), allowNull: false }
  }, { tableName: 'order_items', underscored: true, updatedAt: false });
};
