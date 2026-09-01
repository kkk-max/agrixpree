const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Pincode', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    pincode: { type: DataTypes.STRING(6), allowNull: false, unique: true },
    area: DataTypes.STRING(150),
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true }
  }, { tableName: 'pincodes', underscored: true });
};
