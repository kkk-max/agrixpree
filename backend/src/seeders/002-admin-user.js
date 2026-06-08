'use strict';
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface) {
    const password_hash = await bcrypt.hash('Admin@123', 12);
    const now = new Date();
    await queryInterface.bulkInsert('users', [{
      uuid: uuidv4(),
      role: 'admin',
      name: 'AgriXpree Admin',
      email: 'admin@agrixpree.com',
      mobile: '9000000000',
      password_hash,
      is_verified: true,
      is_active: true,
      kyc_status: 'approved',
      created_at: now,
      updated_at: now
    }], { returning: true });

    // Create wallet for admin
    await queryInterface.sequelize.query(`
      INSERT INTO wallets (user_id, balance, currency, is_active, created_at, updated_at)
      SELECT id, 0, 'INR', true, NOW(), NOW() FROM users WHERE mobile = '9000000000' LIMIT 1
    `);
  },
  async down(queryInterface) {
    await queryInterface.bulkDelete('users', { mobile: '9000000000' }, {});
  }
};
