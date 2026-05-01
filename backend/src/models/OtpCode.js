const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('OtpCode', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    mobile: { type: DataTypes.STRING(15), allowNull: false },
    code: { type: DataTypes.STRING(6), allowNull: false },
    purpose: { type: DataTypes.ENUM('registration', 'login', 'password_reset'), allowNull: false },
    is_used: { type: DataTypes.BOOLEAN, defaultValue: false },
    expires_at: { type: DataTypes.DATE, allowNull: false }
  }, { tableName: 'otp_codes', underscored: true, updatedAt: false });
};
