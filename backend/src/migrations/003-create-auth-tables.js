'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('otp_codes', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      mobile: { type: Sequelize.STRING(15), allowNull: false },
      code: { type: Sequelize.STRING(6), allowNull: false },
      purpose: { type: Sequelize.ENUM('registration', 'login', 'password_reset'), allowNull: false },
      is_used: { type: Sequelize.BOOLEAN, defaultValue: false },
      expires_at: { type: Sequelize.DATE, allowNull: false },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW }
    });

    await queryInterface.createTable('refresh_tokens', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      user_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      token: { type: Sequelize.STRING(500), allowNull: false },
      device_info: Sequelize.STRING(300),
      expires_at: { type: Sequelize.DATE, allowNull: false },
      is_revoked: { type: Sequelize.BOOLEAN, defaultValue: false },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW }
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('refresh_tokens');
    await queryInterface.dropTable('otp_codes');
  }
};
