const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('ShopOrder', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    uuid: { type: DataTypes.CHAR(36), allowNull: false, unique: true },
    user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    customer_name: { type: DataTypes.STRING(200), allowNull: false },
    customer_phone: { type: DataTypes.STRING(20), allowNull: false },
    customer_email: { type: DataTypes.STRING(200) },
    delivery_address: { type: DataTypes.TEXT, allowNull: false },
    delivery_pincode: { type: DataTypes.STRING(10), allowNull: false },
    delivery_charge: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    total_amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'out_for_delivery', 'delivered', 'cancelled'),
      defaultValue: 'pending'
    },
    notes: DataTypes.TEXT
  }, { tableName: 'shop_orders', underscored: true });
};
