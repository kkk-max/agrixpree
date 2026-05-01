const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('RefreshToken', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    token: { type: DataTypes.STRING(500), allowNull: false },
    device_info: DataTypes.STRING(300),
    expires_at: { type: DataTypes.DATE, allowNull: false },
    is_revoked: { type: DataTypes.BOOLEAN, defaultValue: false }
  }, { tableName: 'refresh_tokens', underscored: true, updatedAt: false });
};
