const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('ProductImage', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    product_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    image_url: { type: DataTypes.STRING(500), allowNull: false },
    thumbnail_url: DataTypes.STRING(500),
    sort_order: { type: DataTypes.INTEGER, defaultValue: 0 },
    is_primary: { type: DataTypes.BOOLEAN, defaultValue: false }
  }, { tableName: 'product_images', underscored: true, updatedAt: false });
};
