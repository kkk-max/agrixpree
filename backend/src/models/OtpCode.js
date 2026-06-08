const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('OtpCode', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    email: { type: DataTypes.STRING(255), allowNull: false },
    mobile: { type: DataTypes.STRING(15), allowNull: true },
    code: { type: DataTypes.STRING(6), allowNull: false },
    purpose: { type: DataTypes.ENUM('registration', 'login', 'password_reset'), allowNull: false },
    is_used: { type: DataTypes.BOOLEAN, defaultValue: false },
    expires_at: { type: DataTypes.DATE, allowNull: false }
  }, { tableName: 'otp_codes', underscored: true, updatedAt: false });
};
