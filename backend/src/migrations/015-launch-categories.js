'use strict';

/**
 * At launch we only sell Fruits & Vegetables. Deactivate every other category
 * so the storefront hides them. Admins can re-enable any category later from
 * the Categories screen (which flips Category.is_active).
 */
const LAUNCH_SLUGS = ['fruits', 'vegetables'];

module.exports = {
  async up(queryInterface, Sequelize) {
    const { Op } = Sequelize;
    await queryInterface.bulkUpdate(
      'categories',
      { is_active: false, updated_at: new Date() },
      { slug: { [Op.notIn]: LAUNCH_SLUGS } }
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkUpdate('categories', { is_active: true, updated_at: new Date() }, {});
  }
};
