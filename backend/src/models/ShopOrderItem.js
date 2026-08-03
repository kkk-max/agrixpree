const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('ShopOrderItem', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    order_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    product_id: { type: DataTypes.INTEGER.UNSIGNED },
    product_name: { type: DataTypes.STRING(200), allowNull: false },
    unit: { type: DataTypes.STRING(50), allowNull: false },
    price_per_unit: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    quantity: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    subtotal: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  }, { tableName: 'shop_order_items', underscored: true, timestamps: false });
};
