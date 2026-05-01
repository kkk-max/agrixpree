'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('wallets', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      user_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, unique: true, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      balance: { type: Sequelize.DECIMAL(12, 2), defaultValue: 0 },
      currency: { type: Sequelize.STRING(3), defaultValue: 'INR' },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW }
    });

    await queryInterface.createTable('wallet_transactions', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      uuid: { type: Sequelize.CHAR(36), allowNull: false, unique: true },
      wallet_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'wallets', key: 'id' } },
      type: { type: Sequelize.ENUM('credit', 'debit'), allowNull: false },
      amount: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
      balance_after: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
      source: { type: Sequelize.ENUM('order_payment', 'order_received', 'deposit', 'withdrawal', 'refund', 'procurement_payment', 'admin_adjustment'), allowNull: false },
      reference_id: Sequelize.INTEGER.UNSIGNED,
      reference_type: Sequelize.STRING(50),
      description: Sequelize.STRING(500),
      status: { type: Sequelize.ENUM('pending', 'completed', 'failed'), defaultValue: 'completed' },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW }
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('wallet_transactions');
    await queryInterface.dropTable('wallets');
  }
};
