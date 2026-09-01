/**
 * Reset shop orders and seed 5 distinct test customers + 5 test orders.
 *
 * Each order differs by customer, status, pincode, items, amount and — crucially —
 * created_at, so the admin "delivery queue" (11 PM cutoff) shows a realistic mix
 * of "Deliver now", "Next batch" and completed orders.
 *
 * Run:  node scripts/seed-test-orders.js
 */
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../src/models');
const { FREE_DELIVERY_THRESHOLD, DELIVERY_FEE, BCRYPT_ROUNDS } = require('../src/config/constants');

const { sequelize, User, Wallet, ShopOrder, ShopOrderItem, Product } = db;

// Relative timestamps so the seed always straddles the 11 PM cutoff.
const now = new Date();
const at = (daysAgo, hour, min) => {
  const d = new Date(now);
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, min, 0, 0);
  return d;
};

const TEST_CUSTOMERS = [
  { name: 'Priya Sharma',  mobile: '9000000001', email: 'priya.test@agrixpree.dev' },
  { name: 'Rahul Mehta',   mobile: '9000000002', email: 'rahul.test@agrixpree.dev' },
  { name: 'Anjali Desai',  mobile: '9000000003', email: 'anjali.test@agrixpree.dev' },
  { name: 'Vikram Patel',  mobile: '9000000004', email: 'vikram.test@agrixpree.dev' },
  { name: 'Meera Joshi',   mobile: '9000000005', email: 'meera.test@agrixpree.dev' },
];

// Order blueprints — items reference product names resolved at runtime.
const ORDER_BLUEPRINTS = [
  {
    customer: 0, status: 'pending', createdAt: at(2, 14, 30),
    pincode: '388315', address: 'B-14, Bakrol Road, near Anand Vidyanagar Circle, Bakrol',
    items: [['Fresh Red Apples', 2], ['Organic Spinach', 1]],
  },
  {
    customer: 1, status: 'confirmed', createdAt: at(1, 20, 15),
    pincode: '388120', address: '22, Shastri Nagar Society, Vallabh Vidyanagar, opp. Sardar Patel Univ.',
    items: [['Alphonso Mangoes', 2]],
  },
  {
    customer: 2, status: 'out_for_delivery', createdAt: at(0, 8, 45),
    pincode: '388325', address: '7, Krishna Bungalows, Karamsad, near Shree Krishna Hospital',
    items: [['Farm Tomatoes', 3], ['Red Onions', 2], ['Potatoes', 5]],
  },
  {
    customer: 3, status: 'delivered', createdAt: at(3, 11, 0),
    pincode: '388345', address: '101, Jitodia Chowkdi, Anand, behind Reliance Fresh',
    items: [['Basmati Rice', 5]],
  },
  {
    customer: 4, status: 'cancelled', createdAt: at(4, 17, 30),
    pincode: '387310', address: '5, Lambhvel Road, Boriavi, Anand, near village panchayat',
    items: [['Ripe Bananas', 1], ['Whole Wheat Flour', 2]],
  },
];

(async () => {
  const t = await sequelize.transaction();
  try {
    // 1. Wipe existing shop orders (items cascade, but clear explicitly to be safe).
    const items = await ShopOrderItem.destroy({ where: {}, transaction: t });
    const orders = await ShopOrder.destroy({ where: {}, transaction: t });
    console.log(`Removed ${orders} orders and ${items} order items.`);

    // 2. Recreate the 5 test customers (idempotent by mobile).
    const password_hash = await bcrypt.hash('Test@1234', BCRYPT_ROUNDS);
    const users = [];
    for (const c of TEST_CUSTOMERS) {
      await User.destroy({ where: { mobile: c.mobile }, transaction: t });
      const user = await User.create({
        uuid: uuidv4(), name: c.name, mobile: c.mobile, email: c.email,
        password_hash, role: 'customer', is_verified: true,
      }, { transaction: t });
      await Wallet.create({ user_id: user.id }, { transaction: t });
      users.push(user);
    }
    console.log(`Created ${users.length} test customers (password: Test@1234).`);

    // 3. Resolve products by name once.
    const productList = await Product.findAll({ where: { status: 'active' }, transaction: t });
    const byName = new Map(productList.map(p => [p.name, p]));

    // 4. Create the 5 orders.
    for (const bp of ORDER_BLUEPRINTS) {
      const cust = users[bp.customer];
      const resolved = bp.items.map(([name, qty]) => {
        const p = byName.get(name);
        if (!p) throw new Error(`Product not found: ${name}`);
        const price = parseFloat(p.price_per_unit);
        return {
          product_id: p.id, product_name: p.name, unit: p.unit,
          price_per_unit: price, quantity: qty,
          subtotal: parseFloat((price * qty).toFixed(2)),
        };
      });
      const goods = parseFloat(resolved.reduce((s, i) => s + i.subtotal, 0).toFixed(2));
      const deliveryCharge = goods >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
      const total = parseFloat((goods + deliveryCharge).toFixed(2));

      const order = await ShopOrder.create({
        uuid: uuidv4(), user_id: cust.id,
        customer_name: cust.name, customer_phone: cust.mobile, customer_email: cust.email,
        delivery_address: bp.address, delivery_pincode: bp.pincode,
        delivery_charge: deliveryCharge, total_amount: total,
        status: bp.status, notes: null,
      }, { transaction: t });

      await ShopOrderItem.bulkCreate(
        resolved.map(i => ({ ...i, order_id: order.id })),
        { transaction: t }
      );

      // Persist the profile address like a real order would.
      await User.update(
        { address: bp.address, pincode: bp.pincode },
        { where: { id: cust.id }, transaction: t }
      );

      // Force the backdated created_at (Sequelize ignores it on create).
      await sequelize.query(
        'UPDATE shop_orders SET created_at = :ts WHERE id = :id',
        { replacements: { ts: bp.createdAt, id: order.id }, transaction: t }
      );

      console.log(`  #${order.uuid.slice(0, 8).toUpperCase()} · ${cust.name} · ${bp.status} · ₹${total} · ${bp.createdAt.toLocaleString('en-IN')}`);
    }

    await t.commit();
    console.log('\nDone. 5 test orders seeded.');
    process.exit(0);
  } catch (err) {
    await t.rollback();
    console.error('Seed failed:', err.message);
    process.exit(1);
  }
})();
