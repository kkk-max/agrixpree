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
  // --- Non-vegetable items ---
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

  // --- Vegetables — fixed gram packs (100g / 250g / 500g / 1kg) ----------
  // Prices from AgriXpree Fresh Vegetable Rate Chart.
  // `price` = 100g pack price (cheapest unit, satisfies NOT-NULL column).
  { cat: 2, name: 'Potato', unit: 'kg', price: 2.50, qty: 500, organic: false, desc: 'Farm-fresh potatoes, great for every Indian kitchen.', packs: mkPacks([[100, 2.50], [250, 6.25], [500, 12.50], [1000, 25]]) },
  { cat: 2, name: 'Onion', unit: 'kg', price: 3.50, qty: 400, organic: false, desc: 'Fresh red onions with a strong, pungent flavour.', packs: mkPacks([[100, 3.50], [250, 8.75], [500, 17.50], [1000, 35]]) },
  { cat: 2, name: 'Tomato', unit: 'kg', price: 6.00, qty: 300, organic: false, desc: 'Vine-ripened tomatoes, perfect for curries and salads.', packs: mkPacks([[100, 6.00], [250, 15.00], [500, 30.00], [1000, 60]]) },
  { cat: 2, name: 'Ringan (Brinjal)', unit: 'kg', price: 8.00, qty: 150, organic: false, desc: 'Glossy, tender brinjals great for bhartha and curries.', packs: mkPacks([[100, 8.00], [250, 20.00], [500, 40.00], [1000, 80]]) },
  { cat: 2, name: 'Gajar (Carrot)', unit: 'kg', price: 8.00, qty: 180, organic: false, desc: 'Sweet, crunchy carrots packed with beta-carotene.', packs: mkPacks([[100, 8.00], [250, 20.00], [500, 40.00], [1000, 80]]) },
  { cat: 2, name: 'Beetroot', unit: 'kg', price: 8.00, qty: 140, organic: false, desc: 'Fresh beetroot, great in salads, juices, and sabzis.', packs: mkPacks([[100, 8.00], [250, 20.00], [500, 40.00], [1000, 80]]) },
  { cat: 2, name: 'Kakdi (Cucumber)', unit: 'kg', price: 10.00, qty: 200, organic: false, desc: 'Cool, crisp cucumbers — perfect for salads and raita.', packs: mkPacks([[100, 10.00], [250, 25.00], [500, 50.00], [1000, 100]]) },
  { cat: 2, name: 'Coriander', unit: 'kg', price: 10.00, qty: 120, organic: false, desc: 'Fresh green coriander leaves for garnish and chutney.', packs: mkPacks([[100, 10.00], [250, 25.00], [500, 50.00], [1000, 100]]) },
  { cat: 2, name: 'Bhinda (Okra)', unit: 'kg', price: 8.00, qty: 160, organic: false, desc: 'Tender bhindi, hand-picked daily.', packs: mkPacks([[100, 8.00], [250, 20.00], [500, 40.00], [1000, 80]]) },
  { cat: 2, name: 'Green Chilli', unit: 'kg', price: 8.00, qty: 80, organic: false, desc: 'Spicy green chillies for the perfect tadka.', packs: mkPacks([[100, 8.00], [250, 20.00], [500, 40.00], [1000, 80]]) },
  { cat: 2, name: 'Giloda', unit: 'kg', price: 8.00, qty: 100, organic: false, desc: 'Fresh giloda (tindora), a seasonal Gujarati favourite.', packs: mkPacks([[100, 8.00], [250, 20.00], [500, 40.00], [1000, 80]]) },
  { cat: 2, name: 'Parvar', unit: 'kg', price: 10.00, qty: 120, organic: false, desc: 'Pointed gourd (parval), great for sabzis and curries.', packs: mkPacks([[100, 10.00], [250, 25.00], [500, 50.00], [1000, 100]]) },
  { cat: 2, name: 'Methi', unit: 'kg', price: 10.00, qty: 100, organic: false, desc: 'Fresh fenugreek leaves for methi thepla, dal, and sabzi.', packs: mkPacks([[100, 10.00], [250, 25.00], [500, 50.00], [1000, 100]]) },
  { cat: 2, name: 'Chori', unit: 'kg', price: 12.00, qty: 90, organic: false, desc: 'Fresh yardlong beans, great in stir-fries and curries.', packs: mkPacks([[100, 12.00], [250, 30.00], [500, 60.00], [1000, 120]]) },
  { cat: 2, name: 'Green Capsicum', unit: 'kg', price: 12.00, qty: 130, organic: false, desc: 'Crunchy green capsicum, great for sabzis and salads.', packs: mkPacks([[100, 12.00], [250, 30.00], [500, 60.00], [1000, 120]]) },
  { cat: 2, name: 'Garlic', unit: 'kg', price: 22.00, qty: 80, organic: false, desc: 'Fresh garlic bulbs with a bold, pungent aroma.', packs: mkPacks([[100, 22.00], [250, 55.00], [500, 110.00], [1000, 220]]) },
  { cat: 2, name: 'Tuvar', unit: 'kg', price: 16.00, qty: 110, organic: false, desc: 'Fresh tuvar (pigeon pea pods), a Gujarati kitchen staple.', packs: mkPacks([[100, 16.00], [250, 40.00], [500, 80.00], [1000, 160]]) },
  { cat: 2, name: 'Dudhi (Bottle Gourd)', unit: 'kg', price: 8.00, qty: 140, organic: false, desc: 'Mild, nutritious bottle gourd for dals and sabzis.', packs: mkPacks([[100, 8.00], [250, 20.00], [500, 40.00], [1000, 80]]) },
  { cat: 2, name: 'Gulka', unit: 'kg', price: 8.00, qty: 100, organic: false, desc: 'Fresh gulka, a local seasonal vegetable.', packs: mkPacks([[100, 8.00], [250, 20.00], [500, 40.00], [1000, 80]]) },
  { cat: 2, name: 'Papdi', unit: 'kg', price: 15.00, qty: 90, organic: false, desc: 'Fresh papdi beans, perfect for undhiyu and sabzis.', packs: mkPacks([[100, 15.00], [250, 37.50], [500, 75.00], [1000, 150]]) },
  { cat: 2, name: 'Drumstick', unit: 'kg', price: 8.00, qty: 80, organic: false, desc: 'Fresh drumsticks (moringa), great in sambar and curries.', packs: mkPacks([[100, 8.00], [250, 20.00], [500, 40.00], [1000, 80]]) },
  { cat: 2, name: 'Broccoli', unit: 'kg', price: 35.00, qty: 60, organic: false, desc: 'Fresh green broccoli florets, rich in nutrients.', packs: mkPacks([[100, 35.00], [250, 87.50], [500, 175.00], [1000, 350]]) },
  { cat: 2, name: 'Vatana (Green Peas)', unit: 'kg', price: 16.00, qty: 120, organic: false, desc: 'Fresh green peas, sweet and tender.', packs: mkPacks([[100, 16.00], [250, 40.00], [500, 80.00], [1000, 160]]) },
  { cat: 2, name: 'Lettuce', unit: 'kg', price: 30.00, qty: 50, organic: false, desc: 'Crisp lettuce leaves for salads and wraps.', packs: mkPacks([[100, 30.00], [250, 75.00], [500, 150.00], [1000, 300]]) },
  { cat: 2, name: 'Cabbage', unit: 'kg', price: 5.00, qty: 200, organic: false, desc: 'Fresh cabbage heads for sabzis, salads, and stir-fries.', packs: mkPacks([[100, 5.00], [250, 12.50], [500, 25.00], [1000, 50]]) },
  { cat: 2, name: 'Karela', unit: 'kg', price: 8.00, qty: 100, organic: false, desc: 'Fresh bitter gourd, a healthy addition to your diet.', packs: mkPacks([[100, 8.00], [250, 20.00], [500, 40.00], [1000, 80]]) },
  { cat: 2, name: 'Kakoda', unit: 'kg', price: 20.00, qty: 70, organic: false, desc: 'Spiny gourd (kakoda), a seasonal delicacy.', packs: mkPacks([[100, 20.00], [250, 50.00], [500, 100.00], [1000, 200]]) },
  // Spinach is currently not available per rate chart
  { cat: 2, name: 'Spinach (Palak)', unit: 'kg', price: 50, qty: 0, organic: false, desc: 'Tender spinach leaves — currently not available.', status: 'inactive' },
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
        status: p.status || 'active',
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
