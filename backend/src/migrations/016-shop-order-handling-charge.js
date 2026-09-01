'use strict';

/**
 * Adds handling_charge to shop_orders (2% Packing & Handling Charge, applied to every order).
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('shop_orders', 'handling_charge', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('shop_orders', 'handling_charge');
  }
};
