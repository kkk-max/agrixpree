const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Document', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    document_type: { type: DataTypes.ENUM('aadhaar', 'pan', 'voter_id', 'land_7_12', 'land_8a', 'crop_photo', 'gstin_cert', 'company_reg', 'address_proof', 'other'), allowNull: false },
    file_url: { type: DataTypes.STRING(500), allowNull: false },
    file_name: DataTypes.STRING(255),
    file_size: DataTypes.INTEGER.UNSIGNED,
    mime_type: DataTypes.STRING(50),
    status: { type: DataTypes.ENUM('pending', 'approved', 'rejected'), defaultValue: 'pending' },
    reviewed_by: DataTypes.INTEGER.UNSIGNED,
    review_notes: DataTypes.TEXT,
    reviewed_at: DataTypes.DATE
  }, { tableName: 'documents', underscored: true });
};
