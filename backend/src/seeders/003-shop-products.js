'use strict';
const { v5: uuidv5 } = require('uuid');

// Fixed namespace so demo products get STABLE uuids across re-seeds.
// Re-running this seeder must not churn product uuids, otherwise any
// persisted client cart (localStorage) points at ids that no longer exist
// and checkout fails with "Product not found".
const SEED_NAMESPACE = '6f8a1e2c-3d4b-4c5a-9e7f-1a2b3c4d5e6f';
const stableUuid = (slug) => uuidv5(slug, SEED_NAMESPACE);

// Build fixed gram packs from [grams, price] pairs, matching the shape the
// admin/storefront use: { id, label, grams, price }.
const packLabel = (g) => (g >= 1000 ? `${g / 1000} kg` : `${g} g`);
const mkPacks = (pairs) => pairs.map(([grams, price]) => ({ id: `g${grams}`, label: packLabel(grams), grams, price }));

// Demo storefront catalogue. Admin user (id 1) is the owner/approver.
const PRODUCTS = [
  { cat: 1, name: 'Fresh Red Apples', unit: 'kg', price: 120, qty: 150, organic: false, desc: 'Crisp, juicy red apples handpicked from Himachal orchards.' },
  { cat: 1, name: 'Ripe Bananas', unit: 'dozen', price: 60, qty: 200, organic: false, desc: 'Naturally ripened robusta bananas, rich in potassium.' },
  { cat: 1, name: 'Alphonso Mangoes', unit: 'kg', price: 260, qty: 80, organic: true, desc: 'The king of mangoes — sweet, aromatic Ratnagiri Alphonso.' },
  { cat: 2, name: 'Farm Tomatoes', unit: 'kg', price: 40, qty: 300, organic: false, desc: 'Vine-ripened tomatoes, perfect for curries and salads.' },
  { cat: 2, name: 'Red Onions', unit: 'kg', price: 35, qty: 400, organic: false, desc: 'Fresh red onions with a strong, pungent flavour.' },
  { cat: 2, name: 'Potatoes', unit: 'kg', price: 30, qty: 500, organic: false, desc: 'Farm-fresh potatoes, great for every Indian kitchen.' },
  { cat: 2, name: 'Organic Spinach', unit: 'kg', price: 50, qty: 120, organic: true, desc: 'Tender pesticide-free spinach leaves, washed and ready.' },
  { cat: 3, name: 'Basmati Rice', unit: 'kg', price: 95, qty: 250, organic: false, desc: 'Long-grain aromatic basmati rice, aged for the perfect texture.' },
  { cat: 3, name: 'Whole Wheat Flour', unit: 'kg', price: 45, qty: 300, organic: false, desc: 'Stone-ground chakki atta from premium wheat.' },
  { cat: 4, name: 'Toor Dal', unit: 'kg', price: 130, qty: 180, organic: false, desc: 'Premium unpolished toor (arhar) dal, high in protein.' },
  { cat: 4, name: 'Chana Dal', unit: 'kg', price: 110, qty: 160, organic: false, desc: 'Split Bengal gram, a staple for dals and snacks.' },
  { cat: 5, name: 'Turmeric Powder', unit: 'kg', price: 220, qty: 90, organic: true, desc: 'Pure high-curcumin turmeric powder, sun-dried and ground.' },
  { cat: 6, name: 'Fresh Cow Milk (1L)', unit: 'piece', price: 60, qty: 100, organic: false, desc: 'Farm-fresh full-cream cow milk delivered daily.' },
  { cat: 7, name: 'Farm Eggs', unit: 'dozen', price: 84, qty: 140, organic: false, desc: 'Free-range brown eggs, rich in protein.' },
  { cat: 8, name: 'Groundnut Oil (1L)', unit: 'piece', price: 185, qty: 110, organic: false, desc: 'Cold-pressed groundnut (peanut) oil, no additives.' },

  // --- Weight-based produce sold as fixed gram packs -------------------
  // `price` is the base fallback (cheapest pack) for the NOT-NULL column;
  // customers see and pay the per-pack price.
  { cat: 2, name: 'Green Capsicum', unit: 'kg', price: 18, qty: 90, organic: false, desc: 'Crunchy green capsicum, great for sabzis and salads.', packs: mkPacks([[250, 18], [500, 34], [1000, 65]]) },
  { cat: 2, name: 'Fresh Okra (Bhindi)', unit: 'kg', price: 15, qty: 110, organic: false, desc: 'Tender bhindi, hand-picked daily.', packs: mkPacks([[250, 15], [500, 28], [1000, 52]]) },
  { cat: 2, name: 'Green Chillies', unit: 'kg', price: 8, qty: 60, organic: false, desc: 'Spicy green chillies for the perfect tadka.', packs: mkPacks([[100, 8], [250, 18], [500, 34]]) },
  { cat: 1, name: 'Seedless Green Grapes', unit: 'kg', price: 22, qty: 70, organic: true, desc: 'Sweet, seedless green grapes — washed and ready to eat.', packs: mkPacks([[250, 22], [500, 42], [1000, 80]]) },
];

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const rows = PRODUCTS.map((p) => {
      const slug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-demo';
      return {
        uuid: stableUuid(slug),
        user_id: 1,
        category_id: p.cat,
        name: p.name,
        slug,
        description: p.desc,
        unit: p.unit,
        price_per_unit: p.price,
        currency: 'INR',
        available_quantity: p.qty,
        minimum_order_qty: 1,
        // JSONB — stringify so the raw bulkInsert casts it correctly.
        packs: JSON.stringify(p.packs || []),
        status: 'active',
        is_draft: false,
        is_organic: p.organic,
        added_by_role: 'admin',
        is_approved: true,
        approved_by: 1,
        approved_at: now,
        created_at: now,
        updated_at: now
      };
    });

    // Idempotent: only insert demo products that aren't already present,
    // so re-running the seeder never trips the unique-slug constraint.
    const [existing] = await queryInterface.sequelize.query(
      "SELECT slug FROM products WHERE slug LIKE '%-demo'"
    );
    const seen = new Set(existing.map(r => r.slug));
    const toInsert = rows.filter(r => !seen.has(r.slug));
    if (toInsert.length) await queryInterface.bulkInsert('products', toInsert);
  },

  async down(queryInterface) {
    const { Op } = require('sequelize');
    await queryInterface.bulkDelete('products', { slug: { [Op.like]: '%-demo' } });
  }
};
