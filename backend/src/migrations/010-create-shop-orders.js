'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('shop_orders', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      uuid: { type: Sequelize.CHAR(36), allowNull: false, unique: true },
      customer_name: { type: Sequelize.STRING(200), allowNull: false },
      customer_phone: { type: Sequelize.STRING(20), allowNull: false },
      customer_email: { type: Sequelize.STRING(200) },
      delivery_address: { type: Sequelize.TEXT, allowNull: false },
      delivery_pincode: { type: Sequelize.STRING(10), allowNull: false },
      total_amount: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      status: { type: Sequelize.ENUM('pending', 'confirmed', 'out_for_delivery', 'delivered', 'cancelled'), defaultValue: 'pending' },
      notes: Sequelize.TEXT,
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW }
    });
    await queryInterface.createTable('shop_order_items', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      order_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'shop_orders', key: 'id' }, onDelete: 'CASCADE' },
      product_id: { type: Sequelize.INTEGER.UNSIGNED, references: { model: 'products', key: 'id' }, onDelete: 'SET NULL' },
      product_name: { type: Sequelize.STRING(200), allowNull: false },
      unit: { type: Sequelize.STRING(50), allowNull: false },
      price_per_unit: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      quantity: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      subtotal: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW }
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('shop_order_items');
    await queryInterface.dropTable('shop_orders');
  }
};
