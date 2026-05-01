const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('BuyerProfile', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, unique: true },
    buyer_type: { type: DataTypes.ENUM('personal', 'company'), allowNull: false },
    company_name: DataTypes.STRING(200),
    gstin: DataTypes.STRING(20),
    business_address: DataTypes.TEXT,
    business_type: DataTypes.STRING(100),
    state: DataTypes.STRING(100),
    district: DataTypes.STRING(100),
    pincode: DataTypes.STRING(10),
    credit_limit: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0.00 },
    credit_verified: { type: DataTypes.BOOLEAN, defaultValue: false }
  }, { tableName: 'buyer_profiles', underscored: true });
};
