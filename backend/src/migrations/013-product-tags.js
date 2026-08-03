'use strict';

/**
 * Adds an optional `tags` column to products so admins can attach up to a couple
 * of marketing labels (e.g. "Organic", "No Pesticide", "Fresh", "Highly Recommended",
 * "High in Demand") that are surfaced on the storefront product cards.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('products', 'tags', {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: []
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('products', 'tags');
  }
};
