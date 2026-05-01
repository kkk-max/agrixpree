'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add rejection_note to products and update status enum
    await queryInterface.addColumn('products', 'rejection_note', { type: Sequelize.TEXT, allowNull: true });
    await queryInterface.changeColumn('products', 'status', {
      type: Sequelize.ENUM('draft', 'active', 'out_of_stock', 'archived', 'pending_approval', 'rejected'),
      defaultValue: 'pending_approval'
    });

    // Procurements table: Agrixpree buys from farmers
    await queryInterface.createTable('procurements', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      uuid: { type: Sequelize.CHAR(36), allowNull: false, unique: true },
      product_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'products', key: 'id' } },
      farmer_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' } },
      admin_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' } },
      quantity: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
      unit: { type: Sequelize.STRING(20), allowNull: false },
      price_per_unit: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      total_amount: { type: Sequelize.DECIMAL(14, 2), allowNull: false },
      status: {
        type: Sequelize.ENUM('pending', 'confirmed', 'in_transit', 'delivered', 'cancelled'),
        defaultValue: 'pending'
      },
      payment_status: {
        type: Sequelize.ENUM('pending', 'partial', 'paid'),
        defaultValue: 'pending'
      },
      payment_amount: { type: Sequelize.DECIMAL(14, 2), defaultValue: 0 },
      expected_delivery_date: Sequelize.DATEONLY,
      delivery_date: Sequelize.DATEONLY,
      notes: Sequelize.TEXT,
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      deleted_at: Sequelize.DATE
    });

    // Agrixpree resale listings: products Agrixpree sells after procurement
    await queryInterface.createTable('resale_listings', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      uuid: { type: Sequelize.CHAR(36), allowNull: false, unique: true },
      procurement_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'procurements', key: 'id' } },
      product_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'products', key: 'id' } },
      selling_price: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      available_quantity: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
      status: {
        type: Sequelize.ENUM('active', 'out_of_stock', 'archived'),
        defaultValue: 'active'
      },
      notes: Sequelize.TEXT,
      created_by: { type: Sequelize.INTEGER.UNSIGNED, references: { model: 'users', key: 'id' } },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('resale_listings');
    await queryInterface.dropTable('procurements');
    await queryInterface.removeColumn('products', 'rejection_note');
    await queryInterface.changeColumn('products', 'status', {
      type: Sequelize.ENUM('draft', 'active', 'out_of_stock', 'archived', 'pending_approval'),
      defaultValue: 'pending_approval'
    });
  }
};
