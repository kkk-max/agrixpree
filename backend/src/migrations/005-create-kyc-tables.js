'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('documents', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      user_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      document_type: { type: Sequelize.ENUM('aadhaar', 'pan', 'voter_id', 'land_7_12', 'land_8a', 'crop_photo', 'gstin_cert', 'company_reg', 'address_proof', 'other'), allowNull: false },
      file_url: { type: Sequelize.STRING(500), allowNull: false },
      file_name: Sequelize.STRING(255),
      file_size: Sequelize.INTEGER.UNSIGNED,
      mime_type: Sequelize.STRING(50),
      status: { type: Sequelize.ENUM('pending', 'approved', 'rejected'), defaultValue: 'pending' },
      reviewed_by: { type: Sequelize.INTEGER.UNSIGNED, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      review_notes: Sequelize.TEXT,
      reviewed_at: Sequelize.DATE,
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW }
    });

    await queryInterface.createTable('verification_steps', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      user_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      step_number: { type: Sequelize.TINYINT, allowNull: false },
      step_name: { type: Sequelize.STRING(100), allowNull: false },
      status: { type: Sequelize.ENUM('pending', 'submitted', 'approved', 'rejected'), defaultValue: 'pending' },
      reviewed_by: { type: Sequelize.INTEGER.UNSIGNED, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      review_notes: Sequelize.TEXT,
      submitted_at: Sequelize.DATE,
      reviewed_at: Sequelize.DATE,
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW }
    });
    await queryInterface.addConstraint('verification_steps', { fields: ['user_id', 'step_number'], type: 'unique', name: 'uk_user_step' });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('verification_steps');
    await queryInterface.dropTable('documents');
  }
};
