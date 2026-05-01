const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('FarmerProfile', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, unique: true },
    farm_name: DataTypes.STRING(200),
    farm_address: DataTypes.TEXT,
    farm_size_acres: DataTypes.DECIMAL(10, 2),
    state: DataTypes.STRING(100),
    district: DataTypes.STRING(100),
    pincode: DataTypes.STRING(10),
    primary_crops: DataTypes.JSON,
    experience_years: DataTypes.INTEGER
  }, { tableName: 'farmer_profiles', underscored: true });
};
