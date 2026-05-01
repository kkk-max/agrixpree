const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    uuid: { type: DataTypes.CHAR(36), allowNull: false, unique: true },
    role: { type: DataTypes.ENUM('farmer', 'buyer', 'admin'), allowNull: false },
    name: { type: DataTypes.STRING(100), allowNull: false },
    email: { type: DataTypes.STRING(150), unique: true },
    mobile: { type: DataTypes.STRING(15), allowNull: false, unique: true },
    password_hash: { type: DataTypes.STRING(255), allowNull: false },
    avatar_url: { type: DataTypes.STRING(500) },
    is_verified: { type: DataTypes.BOOLEAN, defaultValue: false },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    kyc_status: { type: DataTypes.ENUM('pending', 'in_progress', 'approved', 'rejected'), defaultValue: 'pending' },
    last_login_at: { type: DataTypes.DATE }
  }, {
    tableName: 'users',
    underscored: true,
    paranoid: true,
    indexes: [{ fields: ['role'] }, { fields: ['mobile'] }, { fields: ['kyc_status'] }, { fields: ['is_active'] }]
  });
  return User;
};
