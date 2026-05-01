const { User, FarmerProfile, BuyerProfile, Product, ProductImage, Category, Order, Document, VerificationStep, AuditLog, Procurement, ResaleListing } = require('../../models');
const { AppError } = require('../../middleware/errorHandler');
const { getPaginationParams, buildPaginationMeta } = require('../../utils/pagination');
const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

// Lazily require to avoid circular deps
const getNotificationService = () => require('../notification/notification.service');

// Need to define QualityCheck model here inline since we didn't include it in models/index
// It's referenced but model may not exist yet — handle gracefully
const getDashboardStats = async () => {
  const [totalFarmers, totalBuyers, pendingVerifications, activeOrders, activeProducts, draftProducts, pendingApprovals] = await Promise.all([
    User.count({ where: { role: 'farmer', is_active: true } }),
    User.count({ where: { role: 'buyer', is_active: true } }),
    User.count({ where: { kyc_status: { [Op.in]: ['pending', 'in_progress'] } } }),
    Order.count({ where: { status: { [Op.in]: ['pending', 'confirmed', 'processing', 'shipped'] } } }),
    Product.count({ where: { status: 'active' } }),
    Product.count({ where: { is_draft: true } }),
    Product.count({ where: { status: 'pending_approval' } })
  ]);

  const recentOrders = await Order.findAll({
    limit: 5,
    order: [['created_at', 'DESC']],
    include: [
      { model: User, as: 'buyer', attributes: ['name'] },
      { model: User, as: 'seller', attributes: ['name'] }
    ]
  });

  const recentRegistrations = await User.findAll({
    limit: 5,
    order: [['created_at', 'DESC']],
    attributes: ['id', 'uuid', 'name', 'role', 'kyc_status', 'created_at']
  });

  return {
    stats: { totalFarmers, totalBuyers, pendingVerifications, activeOrders, activeProducts, draftProducts, pendingApprovals },
    recentOrders,
    recentRegistrations
  };
};

const getUsers = async (query) => {
  const { page, limit, offset } = getPaginationParams(query);
  const where = { role: { [Op.ne]: 'admin' } };

  if (query.role) where.role = query.role;
  if (query.kycStatus) where.kyc_status = query.kycStatus;
  if (query.search) {
    where[Op.or] = [{ name: { [Op.like]: `%${query.search}%` } }, { mobile: { [Op.like]: `%${query.search}%` } }];
  }

  const { count, rows } = await User.findAndCountAll({
    where,
    attributes: ['id', 'uuid', 'name', 'mobile', 'email', 'role', 'kyc_status', 'is_verified', 'is_active', 'created_at'],
    limit, offset, order: [['created_at', 'DESC']]
  });

  return { users: rows, pagination: buildPaginationMeta(count, page, limit) };
};

const updateUserStatus = async (userId, { isActive, reason }, adminId) => {
  const user = await User.findOne({ where: { uuid: userId } });
  if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');

  await user.update({ is_active: isActive });
  await AuditLog.create({ user_id: adminId, action: isActive ? 'activate_user' : 'deactivate_user', entity_type: 'user', entity_id: user.id, new_values: { isActive, reason } });

  return { message: `User ${isActive ? 'activated' : 'deactivated'}` };
};

const reviewDocument = async (documentId, { status, notes }, adminId) => {
  const doc = await Document.findByPk(documentId);
  if (!doc) throw new AppError('Document not found', 404, 'NOT_FOUND');

  await doc.update({ status, reviewed_by: adminId, review_notes: notes, reviewed_at: new Date() });

  await getNotificationService().createNotification({
    userId: doc.user_id,
    type: 'kyc',
    title: `Document ${status === 'approved' ? 'Approved' : 'Rejected'}`,
    message: `Your document has been ${status}. ${notes || ''}`,
    referenceId: doc.id,
    referenceType: 'document'
  });

  return doc;
};

const reviewVerificationStep = async (userId, stepNumber, { status, notes }, adminId) => {
  const user = await User.findOne({ where: { uuid: userId } });
  if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');

  const step = await VerificationStep.findOne({ where: { user_id: user.id, step_number: stepNumber } });
  if (!step) throw new AppError('Step not found', 404, 'NOT_FOUND');

  await step.update({ status, reviewed_by: adminId, review_notes: notes, reviewed_at: new Date() });

  // Check if all 3 steps approved
  const steps = await VerificationStep.findAll({ where: { user_id: user.id } });
  const allApproved = steps.every(s => s.status === 'approved');
  if (allApproved) {
    await user.update({ kyc_status: 'approved', is_verified: true });
    await getNotificationService().createNotification({ userId: user.id, type: 'kyc', title: 'KYC Approved', message: 'Your account has been fully verified!', referenceType: 'user' });
  } else {
    const anySubmitted = steps.some(s => s.status === 'submitted' || s.status === 'approved');
    if (anySubmitted) await user.update({ kyc_status: 'in_progress' });
  }

  return step;
};

const productIncludes = [
  { model: Category, as: 'category', attributes: ['id', 'name'] },
  { model: ProductImage, as: 'images', attributes: ['id', 'image_url', 'is_primary'] },
  { model: User, as: 'farmer', attributes: ['id', 'uuid', 'name', 'mobile'], include: [{ model: FarmerProfile, as: 'farmerProfile', attributes: ['farm_name', 'state', 'district'] }] }
];

const getAdminProducts = async (query) => {
  const { page, limit, offset } = getPaginationParams(query);
  const where = {};
  if (query.status) where.status = query.status;
  if (query.search) where.name = { [Op.like]: `%${query.search}%` };
  if (query.categoryId) where.category_id = query.categoryId;

  const { count, rows } = await Product.findAndCountAll({
    where, include: productIncludes,
    limit, offset, order: [['created_at', 'DESC']], distinct: true
  });
  return { products: rows, pagination: buildPaginationMeta(count, page, limit) };
};

const approveProduct = async (productId, adminId) => {
  const product = await Product.findOne({ where: { uuid: productId } });
  if (!product) throw new AppError('Product not found', 404, 'NOT_FOUND');

  await product.update({ is_approved: true, approved_by: adminId, approved_at: new Date(), status: 'active', rejection_note: null });

  await getNotificationService().createNotification({
    userId: product.user_id, type: 'system',
    title: 'Product Approved',
    message: `Your product "${product.name}" has been approved and is now live!`,
    referenceId: product.id, referenceType: 'product'
  });

  return { message: 'Product approved' };
};

const rejectProduct = async (productId, { rejectionNote }, adminId) => {
  const product = await Product.findOne({ where: { uuid: productId } });
  if (!product) throw new AppError('Product not found', 404, 'NOT_FOUND');

  await product.update({ is_approved: false, approved_by: adminId, approved_at: new Date(), status: 'rejected', rejection_note: rejectionNote || null });

  await getNotificationService().createNotification({
    userId: product.user_id, type: 'system',
    title: 'Product Rejected',
    message: `Your product "${product.name}" was not approved.${rejectionNote ? ' Reason: ' + rejectionNote : ''}`,
    referenceId: product.id, referenceType: 'product'
  });

  return { message: 'Product rejected' };
};

// --- Procurement ---

const procurementIncludes = [
  { model: Product, as: 'product', attributes: ['id', 'uuid', 'name', 'unit', 'price_per_unit'], include: [{ model: ProductImage, as: 'images', where: { is_primary: true }, required: false }] },
  { model: User, as: 'farmer', attributes: ['id', 'uuid', 'name', 'mobile'], include: [{ model: FarmerProfile, as: 'farmerProfile', attributes: ['farm_name', 'state'] }] },
  { model: User, as: 'admin', attributes: ['id', 'name'] }
];

const getProcurements = async (query) => {
  const { page, limit, offset } = getPaginationParams(query);
  const where = {};
  if (query.status) where.status = query.status;
  if (query.paymentStatus) where.payment_status = query.paymentStatus;

  const { count, rows } = await Procurement.findAndCountAll({
    where, include: procurementIncludes,
    limit, offset, order: [['created_at', 'DESC']], distinct: true
  });
  return { procurements: rows, pagination: buildPaginationMeta(count, page, limit) };
};

const createProcurement = async ({ productId, quantity, pricePerUnit, expectedDeliveryDate, notes }, adminId) => {
  const product = await Product.findOne({ where: { uuid: productId }, include: [{ model: User, as: 'farmer', attributes: ['id'] }] });
  if (!product) throw new AppError('Product not found', 404, 'NOT_FOUND');
  if (product.available_quantity < quantity) throw new AppError('Requested quantity exceeds available stock', 400, 'INSUFFICIENT_STOCK');

  const totalAmount = quantity * pricePerUnit;
  const procurement = await Procurement.create({
    uuid: uuidv4(),
    product_id: product.id,
    farmer_id: product.user_id,
    admin_id: adminId,
    quantity,
    unit: product.unit,
    price_per_unit: pricePerUnit,
    total_amount: totalAmount,
    expected_delivery_date: expectedDeliveryDate || null,
    notes: notes || null
  });

  // Reserve quantity on the product
  await product.update({ available_quantity: product.available_quantity - quantity });

  await getNotificationService().createNotification({
    userId: product.user_id, type: 'system',
    title: 'Direct Procurement Order',
    message: `Agrixpree has placed a direct procurement order for ${quantity} ${product.unit} of "${product.name}" at ₹${pricePerUnit}/${product.unit}.`,
    referenceId: procurement.id, referenceType: 'procurement'
  });

  return procurement.reload({ include: procurementIncludes });
};

const updateProcurementStatus = async (procurementId, { status, paymentAmount, paymentStatus, deliveryDate, notes }, adminId) => {
  const procurement = await Procurement.findOne({ where: { uuid: procurementId } });
  if (!procurement) throw new AppError('Procurement not found', 404, 'NOT_FOUND');

  const updates = {};
  if (status) updates.status = status;
  if (paymentStatus) updates.payment_status = paymentStatus;
  if (paymentAmount !== undefined) updates.payment_amount = paymentAmount;
  if (deliveryDate) updates.delivery_date = deliveryDate;
  if (notes !== undefined) updates.notes = notes;

  // If cancelled, return stock to farmer
  if (status === 'cancelled' && procurement.status !== 'cancelled') {
    const product = await Product.findByPk(procurement.product_id);
    if (product) await product.update({ available_quantity: parseFloat(product.available_quantity) + parseFloat(procurement.quantity) });
  }

  // If paid fully, notify farmer
  if (paymentStatus === 'paid') {
    await getNotificationService().createNotification({
      userId: procurement.farmer_id, type: 'system',
      title: 'Payment Received',
      message: `Payment of ₹${procurement.total_amount} for your procurement order has been processed.`,
      referenceId: procurement.id, referenceType: 'procurement'
    });
  }

  await procurement.update(updates);
  return procurement.reload({ include: procurementIncludes });
};

const createResaleListing = async (procurementId, { sellingPrice, availableQuantity, notes }, adminId) => {
  const procurement = await Procurement.findOne({ where: { uuid: procurementId } });
  if (!procurement) throw new AppError('Procurement not found', 404, 'NOT_FOUND');
  if (procurement.status !== 'delivered') throw new AppError('Can only relist delivered procurements', 400, 'INVALID_STATUS');

  const existing = await ResaleListing.findOne({ where: { procurement_id: procurement.id, status: 'active' } });
  if (existing) throw new AppError('Active resale listing already exists for this procurement', 400, 'ALREADY_LISTED');

  const listing = await ResaleListing.create({
    uuid: uuidv4(),
    procurement_id: procurement.id,
    product_id: procurement.product_id,
    selling_price: sellingPrice,
    available_quantity: availableQuantity || procurement.quantity,
    notes: notes || null,
    created_by: adminId
  });

  return listing.reload({ include: [{ model: Product, as: 'product', attributes: ['id', 'uuid', 'name', 'unit'] }] });
};

const getResaleListings = async (query) => {
  const { page, limit, offset } = getPaginationParams(query);
  const where = {};
  if (query.status) where.status = query.status;

  const { count, rows } = await ResaleListing.findAndCountAll({
    where,
    include: [
      { model: Product, as: 'product', attributes: ['id', 'uuid', 'name', 'unit'], include: [{ model: ProductImage, as: 'images', where: { is_primary: true }, required: false }] },
      { model: Procurement, as: 'procurement', attributes: ['id', 'uuid', 'quantity', 'price_per_unit', 'total_amount'] }
    ],
    limit, offset, order: [['created_at', 'DESC']], distinct: true
  });
  return { listings: rows, pagination: buildPaginationMeta(count, page, limit) };
};

module.exports = { getDashboardStats, getUsers, updateUserStatus, reviewDocument, reviewVerificationStep, getAdminProducts, approveProduct, rejectProduct, getProcurements, createProcurement, updateProcurementStatus, createResaleListing, getResaleListings };
