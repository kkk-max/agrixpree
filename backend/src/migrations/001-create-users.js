'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      uuid: { type: Sequelize.CHAR(36), allowNull: false, unique: true },
      role: { type: Sequelize.ENUM('farmer', 'buyer', 'admin'), allowNull: false },
      name: { type: Sequelize.STRING(100), allowNull: false },
      email: { type: Sequelize.STRING(150), unique: true },
      mobile: { type: Sequelize.STRING(15), allowNull: false, unique: true },
      password_hash: { type: Sequelize.STRING(255), allowNull: false },
      avatar_url: Sequelize.STRING(500),
      is_verified: { type: Sequelize.BOOLEAN, defaultValue: false },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      kyc_status: { type: Sequelize.ENUM('pending', 'in_progress', 'approved', 'rejected'), defaultValue: 'pending' },
      last_login_at: Sequelize.DATE,
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      deleted_at: Sequelize.DATE
    });
  },
  async down(queryInterface) { await queryInterface.dropTable('users'); }
};
