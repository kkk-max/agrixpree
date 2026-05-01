const { Sequelize } = require('sequelize');
const config = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, dbConfig);

const User = require('./User')(sequelize);
const FarmerProfile = require('./FarmerProfile')(sequelize);
const BuyerProfile = require('./BuyerProfile')(sequelize);
const OtpCode = require('./OtpCode')(sequelize);
const RefreshToken = require('./RefreshToken')(sequelize);
const Wallet = require('./Wallet')(sequelize);
const WalletTransaction = require('./WalletTransaction')(sequelize);
const Category = require('./Category')(sequelize);
const Product = require('./Product')(sequelize);
const ProductImage = require('./ProductImage')(sequelize);
const Document = require('./Document')(sequelize);
const VerificationStep = require('./VerificationStep')(sequelize);
const Order = require('./Order')(sequelize);
const OrderItem = require('./OrderItem')(sequelize);
const Notification = require('./Notification')(sequelize);
const AuditLog = require('./AuditLog')(sequelize);
const Procurement = require('./Procurement')(sequelize);
const ResaleListing = require('./ResaleListing')(sequelize);

// Associations
User.hasOne(FarmerProfile, { foreignKey: 'user_id', as: 'farmerProfile' });
FarmerProfile.belongsTo(User, { foreignKey: 'user_id' });

User.hasOne(BuyerProfile, { foreignKey: 'user_id', as: 'buyerProfile' });
BuyerProfile.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(RefreshToken, { foreignKey: 'user_id' });
User.hasOne(Wallet, { foreignKey: 'user_id', as: 'wallet' });
Wallet.belongsTo(User, { foreignKey: 'user_id' });
Wallet.hasMany(WalletTransaction, { foreignKey: 'wallet_id', as: 'transactions' });

User.hasMany(Document, { foreignKey: 'user_id', as: 'documents' });
Document.belongsTo(User, { foreignKey: 'user_id' });
Document.belongsTo(User, { foreignKey: 'reviewed_by', as: 'reviewer' });

User.hasMany(VerificationStep, { foreignKey: 'user_id', as: 'verificationSteps' });
VerificationStep.belongsTo(User, { foreignKey: 'user_id' });

Category.hasMany(Category, { foreignKey: 'parent_id', as: 'subcategories' });
Category.belongsTo(Category, { foreignKey: 'parent_id', as: 'parent' });
Category.hasMany(Product, { foreignKey: 'category_id' });

User.hasMany(Product, { foreignKey: 'user_id', as: 'products' });
Product.belongsTo(User, { foreignKey: 'user_id', as: 'farmer' });
Product.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });
Product.hasMany(ProductImage, { foreignKey: 'product_id', as: 'images' });
ProductImage.belongsTo(Product, { foreignKey: 'product_id' });

Order.belongsTo(User, { foreignKey: 'buyer_id', as: 'buyer' });
Order.belongsTo(User, { foreignKey: 'seller_id', as: 'seller' });
Order.hasMany(OrderItem, { foreignKey: 'order_id', as: 'items' });
OrderItem.belongsTo(Order, { foreignKey: 'order_id' });
OrderItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'user_id' });

Procurement.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
Procurement.belongsTo(User, { foreignKey: 'farmer_id', as: 'farmer' });
Procurement.belongsTo(User, { foreignKey: 'admin_id', as: 'admin' });
Procurement.hasMany(ResaleListing, { foreignKey: 'procurement_id', as: 'resaleListings' });
Product.hasMany(Procurement, { foreignKey: 'product_id', as: 'procurements' });
ResaleListing.belongsTo(Procurement, { foreignKey: 'procurement_id', as: 'procurement' });
ResaleListing.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

module.exports = { sequelize, Sequelize, User, FarmerProfile, BuyerProfile, OtpCode, RefreshToken, Wallet, WalletTransaction, Category, Product, ProductImage, Document, VerificationStep, Order, OrderItem, Notification, AuditLog, Procurement, ResaleListing };
