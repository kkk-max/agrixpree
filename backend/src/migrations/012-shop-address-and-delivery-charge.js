'use strict';

/**
 * - Adds a saved delivery address (address + pincode) to users so shop customers
 *   can store and reuse/update their default delivery address.
 * - Adds delivery_charge to shop_orders (free above the threshold, flat fee below).
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'address', { type: Sequelize.TEXT, allowNull: true });
    await queryInterface.addColumn('users', 'pincode', { type: Sequelize.STRING(10), allowNull: true });
    await queryInterface.addColumn('shop_orders', 'delivery_charge', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('users', 'address');
    await queryInterface.removeColumn('users', 'pincode');
    await queryInterface.removeColumn('shop_orders', 'delivery_charge');
  }
};
