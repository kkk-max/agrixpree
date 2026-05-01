'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('categories', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      name: { type: Sequelize.STRING(100), allowNull: false, unique: true },
      slug: { type: Sequelize.STRING(100), allowNull: false, unique: true },
      description: Sequelize.TEXT,
      image_url: Sequelize.STRING(500),
      parent_id: { type: Sequelize.INTEGER.UNSIGNED, references: { model: 'categories', key: 'id' }, onDelete: 'SET NULL' },
      sort_order: { type: Sequelize.INTEGER, defaultValue: 0 },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW }
    });

    await queryInterface.createTable('products', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      uuid: { type: Sequelize.CHAR(36), allowNull: false, unique: true },
      user_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      category_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'categories', key: 'id' } },
      name: { type: Sequelize.STRING(200), allowNull: false },
      slug: { type: Sequelize.STRING(200), allowNull: false },
      description: Sequelize.TEXT,
      unit: { type: Sequelize.ENUM('kg', 'quintal', 'ton', 'piece', 'dozen', 'crate'), defaultValue: 'kg' },
      price_per_unit: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      currency: { type: Sequelize.STRING(3), defaultValue: 'INR' },
      available_quantity: { type: Sequelize.DECIMAL(12, 2), defaultValue: 0 },
      minimum_order_qty: { type: Sequelize.DECIMAL(10, 2), defaultValue: 1 },
      status: { type: Sequelize.ENUM('draft', 'active', 'out_of_stock', 'archived', 'pending_approval'), defaultValue: 'pending_approval' },
      is_draft: { type: Sequelize.BOOLEAN, defaultValue: false },
      expected_harvest_date: Sequelize.DATEONLY,
      sowing_date: Sequelize.DATEONLY,
      draft_notes: Sequelize.TEXT,
      quality_grade: { type: Sequelize.ENUM('A', 'B', 'C', 'ungraded'), defaultValue: 'ungraded' },
      quality_checked: { type: Sequelize.BOOLEAN, defaultValue: false },
      quality_checked_by: { type: Sequelize.INTEGER.UNSIGNED, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      quality_notes: Sequelize.TEXT,
      quality_checked_at: Sequelize.DATE,
      origin_state: Sequelize.STRING(100),
      origin_district: Sequelize.STRING(100),
      is_organic: { type: Sequelize.BOOLEAN, defaultValue: false },
      shelf_life_days: Sequelize.INTEGER,
      added_by_role: { type: Sequelize.ENUM('farmer', 'admin'), allowNull: false },
      is_approved: { type: Sequelize.BOOLEAN, defaultValue: false },
      approved_by: { type: Sequelize.INTEGER.UNSIGNED, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      approved_at: Sequelize.DATE,
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      deleted_at: Sequelize.DATE
    });

    await queryInterface.createTable('product_images', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      product_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'products', key: 'id' }, onDelete: 'CASCADE' },
      image_url: { type: Sequelize.STRING(500), allowNull: false },
      thumbnail_url: Sequelize.STRING(500),
      sort_order: { type: Sequelize.INTEGER, defaultValue: 0 },
      is_primary: { type: Sequelize.BOOLEAN, defaultValue: false },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW }
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('product_images');
    await queryInterface.dropTable('products');
    await queryInterface.dropTable('categories');
  }
};
