'use strict';

/**
 * Weight-based products (mainly vegetables) can be sold as fixed gram packs,
 * e.g. 250g / 500g / 1kg, each with its own price. Stored as JSONB:
 *   [{ id, label, grams, price }]
 * An empty array means the product uses the classic `unit` + `price_per_unit`
 * pricing instead.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('products', 'packs', {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: []
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('products', 'packs');
  }
};
