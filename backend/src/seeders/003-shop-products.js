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

// Demo storefront catalogue — non-vegetable items only.
// Vegetables are real products (slug suffix -prod) updated via 006-update-product-prices.js
const PRODUCTS = [
  { cat: 1, name: 'Fresh Red Apples', unit: 'kg', price: 120, qty: 150, organic: false, desc: 'Crisp, juicy red apples handpicked from Himachal orchards.' },
  { cat: 1, name: 'Ripe Bananas', unit: 'dozen', price: 60, qty: 200, organic: false, desc: 'Naturally ripened robusta bananas, rich in potassium.' },
  { cat: 1, name: 'Alphonso Mangoes', unit: 'kg', price: 260, qty: 80, organic: true, desc: 'The king of mangoes — sweet, aromatic Ratnagiri Alphonso.' },
  { cat: 3, name: 'Basmati Rice', unit: 'kg', price: 95, qty: 250, organic: false, desc: 'Long-grain aromatic basmati rice, aged for the perfect texture.' },
  { cat: 3, name: 'Whole Wheat Flour', unit: 'kg', price: 45, qty: 300, organic: false, desc: 'Stone-ground chakki atta from premium wheat.' },
  { cat: 4, name: 'Toor Dal', unit: 'kg', price: 130, qty: 180, organic: false, desc: 'Premium unpolished toor (arhar) dal, high in protein.' },
  { cat: 4, name: 'Chana Dal', unit: 'kg', price: 110, qty: 160, organic: false, desc: 'Split Bengal gram, a staple for dals and snacks.' },
  { cat: 5, name: 'Turmeric Powder', unit: 'kg', price: 220, qty: 90, organic: true, desc: 'Pure high-curcumin turmeric powder, sun-dried and ground.' },
  { cat: 6, name: 'Fresh Cow Milk (1L)', unit: 'piece', price: 60, qty: 100, organic: false, desc: 'Farm-fresh full-cream cow milk delivered daily.' },
  { cat: 7, name: 'Farm Eggs', unit: 'dozen', price: 84, qty: 140, organic: false, desc: 'Free-range brown eggs, rich in protein.' },
  { cat: 8, name: 'Groundnut Oil (1L)', unit: 'piece', price: 185, qty: 110, organic: false, desc: 'Cold-pressed groundnut (peanut) oil, no additives.' },
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
