const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('ResaleListing', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    uuid: { type: DataTypes.CHAR(36), allowNull: false, unique: true },
    procurement_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    product_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    selling_price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    available_quantity: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    status: {
      type: DataTypes.ENUM('active', 'out_of_stock', 'archived'),
      defaultValue: 'active'
    },
    notes: DataTypes.TEXT,
    created_by: DataTypes.INTEGER.UNSIGNED
  }, { tableName: 'resale_listings', underscored: true });
};
