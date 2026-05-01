'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('farmer_profiles', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      user_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, unique: true, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      farm_name: Sequelize.STRING(200),
      farm_address: Sequelize.TEXT,
      farm_size_acres: Sequelize.DECIMAL(10, 2),
      state: Sequelize.STRING(100),
      district: Sequelize.STRING(100),
      pincode: Sequelize.STRING(10),
      primary_crops: Sequelize.JSON,
      experience_years: Sequelize.INTEGER,
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW }
    });

    await queryInterface.createTable('buyer_profiles', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      user_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, unique: true, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      buyer_type: { type: Sequelize.ENUM('personal', 'company'), allowNull: false },
      company_name: Sequelize.STRING(200),
      gstin: Sequelize.STRING(20),
      business_address: Sequelize.TEXT,
      business_type: Sequelize.STRING(100),
      state: Sequelize.STRING(100),
      district: Sequelize.STRING(100),
      pincode: Sequelize.STRING(10),
      credit_limit: { type: Sequelize.DECIMAL(12, 2), defaultValue: 0 },
      credit_verified: { type: Sequelize.BOOLEAN, defaultValue: false },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW }
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('buyer_profiles');
    await queryInterface.dropTable('farmer_profiles');
  }
};
