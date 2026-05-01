'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('orders', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      uuid: { type: Sequelize.CHAR(36), allowNull: false, unique: true },
      order_number: { type: Sequelize.STRING(20), allowNull: false, unique: true },
      buyer_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' } },
      seller_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' } },
      order_type: { type: Sequelize.ENUM('marketplace', 'procurement'), defaultValue: 'marketplace' },
      status: { type: Sequelize.ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'completed', 'cancelled', 'disputed'), defaultValue: 'pending' },
      subtotal: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
      tax_amount: { type: Sequelize.DECIMAL(10, 2), defaultValue: 0 },
      shipping_amount: { type: Sequelize.DECIMAL(10, 2), defaultValue: 0 },
      discount_amount: { type: Sequelize.DECIMAL(10, 2), defaultValue: 0 },
      total_amount: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
      payment_status: { type: Sequelize.ENUM('unpaid', 'partial', 'paid', 'refunded'), defaultValue: 'unpaid' },
      payment_method: Sequelize.ENUM('wallet', 'upi', 'card', 'netbanking', 'cod'),
      shipping_address: Sequelize.TEXT,
      shipping_state: Sequelize.STRING(100),
      shipping_district: Sequelize.STRING(100),
      shipping_pincode: Sequelize.STRING(10),
      expected_delivery: Sequelize.DATEONLY,
      delivered_at: Sequelize.DATE,
      buyer_notes: Sequelize.TEXT,
      seller_notes: Sequelize.TEXT,
      admin_notes: Sequelize.TEXT,
      cancellation_reason: Sequelize.TEXT,
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW }
    });

    await queryInterface.createTable('order_items', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      order_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'orders', key: 'id' }, onDelete: 'CASCADE' },
      product_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'products', key: 'id' } },
      product_name: { type: Sequelize.STRING(200), allowNull: false },
      unit: { type: Sequelize.STRING(20), allowNull: false },
      price_per_unit: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      quantity: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      total_price: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW }
    });

    await queryInterface.createTable('notifications', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      user_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      type: { type: Sequelize.ENUM('order', 'kyc', 'wallet', 'system', 'stock', 'procurement', 'chat'), allowNull: false },
      title: { type: Sequelize.STRING(200), allowNull: false },
      message: { type: Sequelize.TEXT, allowNull: false },
      is_read: { type: Sequelize.BOOLEAN, defaultValue: false },
      reference_id: Sequelize.INTEGER.UNSIGNED,
      reference_type: Sequelize.STRING(50),
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW }
    });

    await queryInterface.createTable('audit_logs', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      user_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' } },
      action: { type: Sequelize.STRING(100), allowNull: false },
      entity_type: { type: Sequelize.STRING(50), allowNull: false },
      entity_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
      old_values: Sequelize.JSON,
      new_values: Sequelize.JSON,
      ip_address: Sequelize.STRING(45),
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW }
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('audit_logs');
    await queryInterface.dropTable('notifications');
    await queryInterface.dropTable('order_items');
    await queryInterface.dropTable('orders');
  }
};
