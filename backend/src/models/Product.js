const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Product', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    uuid: { type: DataTypes.CHAR(36), allowNull: false, unique: true },
    user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    category_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    name: { type: DataTypes.STRING(200), allowNull: false },
    slug: { type: DataTypes.STRING(200), allowNull: false },
    description: DataTypes.TEXT,
    unit: { type: DataTypes.ENUM('kg', 'quintal', 'ton', 'piece', 'dozen', 'crate'), defaultValue: 'kg' },
    price_per_unit: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    currency: { type: DataTypes.STRING(3), defaultValue: 'INR' },
    available_quantity: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0.00 },
    minimum_order_qty: { type: DataTypes.DECIMAL(10, 2), defaultValue: 1.00 },
    status: { type: DataTypes.ENUM('draft', 'active', 'out_of_stock', 'archived', 'pending_approval', 'rejected'), defaultValue: 'pending_approval' },
    rejection_note: DataTypes.TEXT,
    is_draft: { type: DataTypes.BOOLEAN, defaultValue: false },
    expected_harvest_date: DataTypes.DATEONLY,
    sowing_date: DataTypes.DATEONLY,
    draft_notes: DataTypes.TEXT,
    quality_grade: { type: DataTypes.ENUM('A', 'B', 'C', 'ungraded'), defaultValue: 'ungraded' },
    quality_checked: { type: DataTypes.BOOLEAN, defaultValue: false },
    quality_checked_by: DataTypes.INTEGER.UNSIGNED,
    quality_notes: DataTypes.TEXT,
    quality_checked_at: DataTypes.DATE,
    origin_state: DataTypes.STRING(100),
    origin_district: DataTypes.STRING(100),
    is_organic: { type: DataTypes.BOOLEAN, defaultValue: false },
    shelf_life_days: DataTypes.INTEGER,
    added_by_role: { type: DataTypes.ENUM('farmer', 'admin'), allowNull: false },
    is_approved: { type: DataTypes.BOOLEAN, defaultValue: false },
    approved_by: DataTypes.INTEGER.UNSIGNED,
    approved_at: DataTypes.DATE
  }, { tableName: 'products', underscored: true, paranoid: true });
};
