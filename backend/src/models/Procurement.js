const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Procurement', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    uuid: { type: DataTypes.CHAR(36), allowNull: false, unique: true },
    product_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    farmer_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    admin_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    quantity: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    unit: { type: DataTypes.STRING(20), allowNull: false },
    price_per_unit: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    total_amount: { type: DataTypes.DECIMAL(14, 2), allowNull: false },
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'in_transit', 'delivered', 'cancelled'),
      defaultValue: 'pending'
    },
    payment_status: {
      type: DataTypes.ENUM('pending', 'partial', 'paid'),
      defaultValue: 'pending'
    },
    payment_amount: { type: DataTypes.DECIMAL(14, 2), defaultValue: 0 },
    expected_delivery_date: DataTypes.DATEONLY,
    delivery_date: DataTypes.DATEONLY,
    notes: DataTypes.TEXT
  }, { tableName: 'procurements', underscored: true, paranoid: true });
};
