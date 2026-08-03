'use strict';

/**
 * - Adds a 'customer' value to the users.role enum (shop customers created at checkout).
 * - Links shop_orders to a user account via nullable user_id (guest orders stay null-safe;
 *   orders placed after the checkout signup are attributed to the customer).
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Postgres 12+ supports ADD VALUE inside a transaction. IF NOT EXISTS keeps this idempotent.
    await queryInterface.sequelize.query(
      `ALTER TYPE "enum_users_role" ADD VALUE IF NOT EXISTS 'customer';`
    );

    await queryInterface.addColumn('shop_orders', 'user_id', {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('shop_orders', 'user_id');
    // Note: Postgres cannot drop a single enum value without recreating the type.
    // The 'customer' role value is intentionally left in place on rollback.
  }
};
