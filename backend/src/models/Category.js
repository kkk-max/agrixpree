const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Category', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    slug: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    description: DataTypes.TEXT,
    image_url: DataTypes.STRING(500),
    parent_id: DataTypes.INTEGER.UNSIGNED,
    sort_order: { type: DataTypes.INTEGER, defaultValue: 0 },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true }
  }, { tableName: 'categories', underscored: true });
};
