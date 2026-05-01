'use strict';

const categories = [
  { name: 'Fruits', slug: 'fruits', sort_order: 1 },
  { name: 'Vegetables', slug: 'vegetables', sort_order: 2 },
  { name: 'Grains', slug: 'grains', sort_order: 3 },
  { name: 'Pulses', slug: 'pulses', sort_order: 4 },
  { name: 'Spices', slug: 'spices', sort_order: 5 },
  { name: 'Dairy', slug: 'dairy', sort_order: 6 },
  { name: 'Poultry', slug: 'poultry', sort_order: 7 },
  { name: 'Oilseeds', slug: 'oilseeds', sort_order: 8 },
  { name: 'Sugarcane', slug: 'sugarcane', sort_order: 9 },
  { name: 'Others', slug: 'others', sort_order: 10 }
];

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    await queryInterface.bulkInsert('categories', categories.map(c => ({ ...c, is_active: true, created_at: now, updated_at: now })));
  },
  async down(queryInterface) {
    await queryInterface.bulkDelete('categories', null, {});
  }
};
