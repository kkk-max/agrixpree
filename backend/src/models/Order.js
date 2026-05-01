const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Order', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    uuid: { type: DataTypes.CHAR(36), allowNull: false, unique: true },
    order_number: { type: DataTypes.STRING(20), allowNull: false, unique: true },
    buyer_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    seller_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    order_type: { type: DataTypes.ENUM('marketplace', 'procurement'), defaultValue: 'marketplace' },
    status: { type: DataTypes.ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'completed', 'cancelled', 'disputed'), defaultValue: 'pending' },
    subtotal: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    tax_amount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.00 },
    shipping_amount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.00 },
    discount_amount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.00 },
    total_amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    payment_status: { type: DataTypes.ENUM('unpaid', 'partial', 'paid', 'refunded'), defaultValue: 'unpaid' },
    payment_method: DataTypes.ENUM('wallet', 'upi', 'card', 'netbanking', 'cod'),
    shipping_address: DataTypes.TEXT,
    shipping_state: DataTypes.STRING(100),
    shipping_district: DataTypes.STRING(100),
    shipping_pincode: DataTypes.STRING(10),
    expected_delivery: DataTypes.DATEONLY,
    delivered_at: DataTypes.DATE,
    buyer_notes: DataTypes.TEXT,
    seller_notes: DataTypes.TEXT,
    admin_notes: DataTypes.TEXT,
    cancellation_reason: DataTypes.TEXT
  }, { tableName: 'orders', underscored: true });
};
