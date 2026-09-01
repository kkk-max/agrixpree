'use strict';

/**
 * Serviceable delivery pincodes, admin-managed. Seeded with the pincodes that
 * were previously hardcoded in frontend/src/config/shop.js and
 * backend/src/modules/shop/shop.service.js.
 */
const SEED_PINCODES = [
  { pincode: '388315', area: 'Bakrol / Vallabh Vidyanagar' },
  { pincode: '388325', area: 'Karamsad, Anand' },
  { pincode: '388120', area: 'Vidyanagar (Vallabh Vidyanagar)' },
  { pincode: '388345', area: 'Jitodia, Anand' },
  { pincode: '387310', area: 'Lambhvel / Boriavi, Anand' },
  { pincode: '388001', area: 'Anand' },
];

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('pincodes', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      pincode: { type: Sequelize.STRING(6), allowNull: false, unique: true },
      area: Sequelize.STRING(150),
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW }
    });

    const now = new Date();
    await queryInterface.bulkInsert('pincodes', SEED_PINCODES.map(p => ({ ...p, is_active: true, created_at: now, updated_at: now })));
  },

  async down(queryInterface) {
    await queryInterface.dropTable('pincodes');
  }
};
