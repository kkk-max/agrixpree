'use strict';

const packLabel = (g) => (g >= 1000 ? `${g / 1000} kg` : `${g} g`);
const mkPacks = (pairs) => pairs.map(([grams, price]) => ({ id: `g${grams}`, label: packLabel(grams), grams, price }));

// Prices from AgriXpree Fresh Vegetable Rate Chart (100g / 250g / 500g / 1kg).
// Each entry matches an existing -prod slug and only updates price_per_unit + packs.
const UPDATES = [
  { slug: 'potato-prod',            price: 2.50,  packs: mkPacks([[100, 2.50],  [250, 6.25],  [500, 12.50], [1000, 25]])  },
  { slug: 'onion-prod',             price: 3.50,  packs: mkPacks([[100, 3.50],  [250, 8.75],  [500, 17.50], [1000, 35]])  },
  { slug: 'tomato-prod',            price: 6.00,  packs: mkPacks([[100, 6.00],  [250, 15.00], [500, 30.00], [1000, 60]])  },
  { slug: 'ringan-brinjal-prod',    price: 8.00,  packs: mkPacks([[100, 8.00],  [250, 20.00], [500, 40.00], [1000, 80]])  },
  { slug: 'gajar-carrot-prod',      price: 8.00,  packs: mkPacks([[100, 8.00],  [250, 20.00], [500, 40.00], [1000, 80]])  },
  { slug: 'beetroot-prod',          price: 8.00,  packs: mkPacks([[100, 8.00],  [250, 20.00], [500, 40.00], [1000, 80]])  },
  { slug: 'kakdi-cucumber-prod',    price: 10.00, packs: mkPacks([[100, 10.00], [250, 25.00], [500, 50.00], [1000, 100]]) },
  { slug: 'coriander-prod',         price: 10.00, packs: mkPacks([[100, 10.00], [250, 25.00], [500, 50.00], [1000, 100]]) },
  { slug: 'bhinda-okra-prod',       price: 8.00,  packs: mkPacks([[100, 8.00],  [250, 20.00], [500, 40.00], [1000, 80]])  },
  { slug: 'green-chilli-prod',      price: 8.00,  packs: mkPacks([[100, 8.00],  [250, 20.00], [500, 40.00], [1000, 80]])  },
  { slug: 'giloda-prod',            price: 8.00,  packs: mkPacks([[100, 8.00],  [250, 20.00], [500, 40.00], [1000, 80]])  },
  { slug: 'parvar-prod',            price: 10.00, packs: mkPacks([[100, 10.00], [250, 25.00], [500, 50.00], [1000, 100]]) },
  { slug: 'methi-prod',             price: 10.00, packs: mkPacks([[100, 10.00], [250, 25.00], [500, 50.00], [1000, 100]]) },
  { slug: 'chori-prod',             price: 12.00, packs: mkPacks([[100, 12.00], [250, 30.00], [500, 60.00], [1000, 120]]) },
  { slug: 'green-capsicum-prod',    price: 12.00, packs: mkPacks([[100, 12.00], [250, 30.00], [500, 60.00], [1000, 120]]) },
  { slug: 'garlic-prod',            price: 22.00, packs: mkPacks([[100, 22.00], [250, 55.00], [500, 110.00],[1000, 220]]) },
  { slug: 'tuvar-prod',             price: 16.00, packs: mkPacks([[100, 16.00], [250, 40.00], [500, 80.00], [1000, 160]]) },
  { slug: 'dudhi-bottle-gourd-prod',price: 8.00,  packs: mkPacks([[100, 8.00],  [250, 20.00], [500, 40.00], [1000, 80]])  },
  { slug: 'gulka-prod',             price: 8.00,  packs: mkPacks([[100, 8.00],  [250, 20.00], [500, 40.00], [1000, 80]])  },
  { slug: 'papdi-prod',             price: 15.00, packs: mkPacks([[100, 15.00], [250, 37.50], [500, 75.00], [1000, 150]]) },
  { slug: 'drumstick-prod',         price: 8.00,  packs: mkPacks([[100, 8.00],  [250, 20.00], [500, 40.00], [1000, 80]])  },
  { slug: 'broccoli-prod',          price: 35.00, packs: mkPacks([[100, 35.00], [250, 87.50], [500, 175.00],[1000, 350]]) },
  { slug: 'vatana-green-peas-prod', price: 16.00, packs: mkPacks([[100, 16.00], [250, 40.00], [500, 80.00], [1000, 160]]) },
  { slug: 'lettuce-prod',           price: 30.00, packs: mkPacks([[100, 30.00], [250, 75.00], [500, 150.00],[1000, 300]]) },
  { slug: 'cabbage-prod',           price: 5.00,  packs: mkPacks([[100, 5.00],  [250, 12.50], [500, 25.00], [1000, 50]])  },
  { slug: 'karela-prod',            price: 8.00,  packs: mkPacks([[100, 8.00],  [250, 20.00], [500, 40.00], [1000, 80]])  },
  { slug: 'kakoda-prod',            price: 20.00, packs: mkPacks([[100, 20.00], [250, 50.00], [500, 100.00],[1000, 200]]) },
  // Spinach not available — qty set to 0, packs cleared
  { slug: 'spinach-palak-prod',     price: 50,    packs: [],                                                available_quantity: 0 },
];

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    for (const item of UPDATES) {
      const set = {
        price_per_unit: item.price,
        packs: JSON.stringify(item.packs),
        updated_at: now,
      };
      if (item.available_quantity !== undefined) {
        set.available_quantity = item.available_quantity;
      }
      await queryInterface.sequelize.query(
        `UPDATE products SET price_per_unit = :price, packs = :packs::jsonb${item.available_quantity !== undefined ? ', available_quantity = :qty' : ''}, updated_at = :now WHERE slug = :slug`,
        {
          replacements: {
            price: item.price,
            packs: JSON.stringify(item.packs),
            qty: item.available_quantity,
            now,
            slug: item.slug,
          },
        }
      );
    }
  },

  async down(queryInterface) {
    // Reverting: clear packs and reset price to 0 for all updated slugs.
    // Set correct values manually if a full rollback is needed.
    const slugs = UPDATES.map(u => `'${u.slug}'`).join(', ');
    await queryInterface.sequelize.query(
      `UPDATE products SET packs = '[]'::jsonb, updated_at = NOW() WHERE slug IN (${slugs})`
    );
  },
};
