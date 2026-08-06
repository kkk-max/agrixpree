'use strict';

// Maps product slug → Unsplash search keyword(s)
const SLUG_KEYWORDS = {
  'potato-prod':             'potato,vegetable',
  'onion-prod':              'onion,vegetable',
  'tomato-prod':             'tomato,fresh',
  'ringan-brinjal-prod':     'eggplant,brinjal',
  'spinach-palak-prod':      'spinach,leafy-green',
  'gajar-carrot-prod':       'carrot,vegetable',
  'beetroot-prod':           'beetroot,beet',
  'kakdi-cucumber-prod':     'cucumber,fresh',
  'coriander-prod':          'coriander,herb',
  'bhinda-okra-prod':        'okra,vegetable',
  'green-chilli-prod':       'green-chilli,chili',
  'giloda-prod':             'ivy-gourd,vegetable',
  'parvar-prod':             'pointed-gourd,vegetable',
  'methi-prod':              'fenugreek,herb',
  'chori-prod':              'cowpea,beans',
  'green-capsicum-prod':     'capsicum,bell-pepper',
  'garlic-prod':             'garlic,fresh',
  'tuvar-prod':              'pigeon-peas,legume',
  'dudhi-bottle-gourd-prod': 'bottle-gourd,vegetable',
  'gulka-prod':              'ridge-gourd,vegetable',
  'papdi-prod':              'flat-beans,vegetable',
  'drumstick-prod':          'drumstick,moringa',
  'broccoli-prod':           'broccoli,vegetable',
  'vatana-green-peas-prod':  'green-peas,peas',
  'avocado-prod':            'avocado,fruit',
  'lettuce-prod':            'lettuce,salad',
  'cabbage-prod':            'cabbage,vegetable',
  'karela-prod':             'bitter-gourd,vegetable',
  'kakoda-prod':             'spine-gourd,vegetable',
};

const BASE = 'https://source.unsplash.com';

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    const [products] = await queryInterface.sequelize.query(
      `SELECT id, slug FROM products WHERE slug LIKE '%-prod'`
    );

    if (!products.length) return;

    // Remove existing images for these products to avoid dupes on re-run
    const ids = products.map(p => p.id);
    await queryInterface.sequelize.query(
      `DELETE FROM product_images WHERE product_id IN (${ids.join(',')})`
    );

    const rows = products.map(p => {
      const kw = SLUG_KEYWORDS[p.slug] || 'vegetable,fresh';
      return {
        product_id: p.id,
        image_url:     `${BASE}/800x600/?${kw}`,
        thumbnail_url: `${BASE}/400x300/?${kw}`,
        sort_order: 0,
        is_primary: true,
        created_at: now,
      };
    });

    await queryInterface.bulkInsert('product_images', rows);
  },

  async down(queryInterface) {
    const [products] = await queryInterface.sequelize.query(
      `SELECT id FROM products WHERE slug LIKE '%-prod'`
    );
    if (!products.length) return;
    const ids = products.map(p => p.id);
    await queryInterface.sequelize.query(
      `DELETE FROM product_images WHERE product_id IN (${ids.join(',')})`
    );
  },
};
