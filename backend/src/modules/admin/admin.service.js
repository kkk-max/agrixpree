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
  const { ShopOrder, ShopOrderItem } = require('../../models');

  // Delivery cutoff: orders received before 11 PM belong to the current run.
  // The most recent 11 PM boundary before now marks what must go out now.
  const now = new Date();
  const lastCutoff = new Date(now);
  lastCutoff.setHours(23, 0, 0, 0);
  if (now < lastCutoff) lastCutoff.setDate(lastCutoff.getDate() - 1);

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const [
    totalFarmers, totalBuyers, pendingVerifications, activeOrders, activeProducts,
    draftProducts, pendingApprovals, pendingShopOrders, totalShopOrders,
    deliveredShopOrders, shopOrdersToDeliver, shopOrdersToday, shopRevenue
  ] = await Promise.all([
    User.count({ where: { role: 'farmer', is_active: true } }),
    User.count({ where: { role: 'buyer', is_active: true } }),
    User.count({ where: { kyc_status: { [Op.in]: ['pending', 'in_progress'] } } }),
    Order.count({ where: { status: { [Op.in]: ['pending', 'confirmed', 'processing', 'shipped'] } } }),
    Product.count({ where: { status: 'active' } }),
    Product.count({ where: { is_draft: true } }),
    Product.count({ where: { status: 'pending_approval' } }),
    ShopOrder.count({ where: { status: { [Op.in]: ['pending', 'confirmed', 'out_for_delivery'] } } }),
    ShopOrder.count(),
    ShopOrder.count({ where: { status: 'delivered' } }),
    // Active orders placed before the last cutoff → the current delivery queue.
    ShopOrder.count({ where: { status: { [Op.in]: ['pending', 'confirmed', 'out_for_delivery'] }, createdAt: { [Op.lte]: lastCutoff } } }),
    ShopOrder.count({ where: { createdAt: { [Op.gte]: startOfToday } } }),
    ShopOrder.sum('total_amount', { where: { status: 'delivered' } })
  ]);

  const recentOrders = await Order.findAll({
    limit: 5,
    order: [['created_at', 'DESC']],
    include: [
      { model: User, as: 'buyer', attributes: ['name'] },
      { model: User, as: 'seller', attributes: ['name'] }
    ]
  });

  const recentShopOrders = await ShopOrder.findAll({
    limit: 8,
    order: [['created_at', 'DESC']],
    include: [{ model: ShopOrderItem, as: 'items', attributes: ['id'] }]
  });

  const recentRegistrations = await User.findAll({
    limit: 5,
    order: [['created_at', 'DESC']],
    attributes: ['id', 'uuid', 'name', 'role', 'kyc_status', 'created_at']
  });

  return {
    stats: {
      totalFarmers, totalBuyers, pendingVerifications, activeOrders, activeProducts,
      draftProducts, pendingApprovals, pendingShopOrders, totalShopOrders,
      deliveredShopOrders, shopOrdersToDeliver, shopOrdersToday,
      shopRevenue: parseFloat(shopRevenue || 0)
    },
    recentOrders,
    recentShopOrders,
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

// --- Shop Product CRUD ---

// Accepts a JSON string, comma-separated string or array and returns a
// cleaned list of at most two non-empty tags (tags are optional).
const parseTags = (raw) => {
  if (raw === undefined || raw === null || raw === '') return [];
  let arr = raw;
  if (typeof raw === 'string') {
    try { arr = JSON.parse(raw); }
    catch { arr = raw.split(',').map(s => s.trim()); }
  }
  if (!Array.isArray(arr)) return [];
  return arr.map(t => String(t).trim()).filter(Boolean).slice(0, 2);
};

const toBool = (v) => v === true || v === 'true';

// Fixed gram packs for weight-based products. Accepts a JSON string (from the
// multipart form) or an array, and returns a cleaned list of
// { id, label, grams, price }. Invalid rows are dropped; packs are sorted by
// weight so the storefront shows them small -> large.
const parsePacks = (raw) => {
  if (raw === undefined || raw === null || raw === '') return [];
  let arr = raw;
  if (typeof raw === 'string') {
    try { arr = JSON.parse(raw); } catch { return []; }
  }
  if (!Array.isArray(arr)) return [];
  const clean = arr
    .map((p) => {
      const grams = Math.round(Number(p.grams));
      const price = Number(p.price);
      if (!Number.isFinite(grams) || grams <= 0) return null;
      if (!Number.isFinite(price) || price < 0) return null;
      const label = String(p.label || '').trim() || (grams >= 1000 ? `${grams / 1000} kg` : `${grams} g`);
      return { id: `g${grams}`, label, grams, price: parseFloat(price.toFixed(2)) };
    })
    .filter(Boolean);
  // De-dupe by weight (id) keeping the first, then sort ascending.
  const seen = new Set();
  return clean
    .filter((p) => (seen.has(p.id) ? false : seen.add(p.id)))
    .sort((a, b) => a.grams - b.grams);
};

const createShopProduct = async (body, files, adminId) => {
  const name = body.name;
  const slug = name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();

  const product = await Product.create({
    uuid: uuidv4(),
    slug,
    name,
    category_id: body.category_id || body.categoryId,
    description: body.description || null,
    unit: body.unit,
    price_per_unit: body.price_per_unit,
    available_quantity: body.available_quantity || 0,
    minimum_order_qty: body.minimum_order_qty || 1,
    status: body.status || 'active',
    is_approved: true,
    approved_by: adminId,
    approved_at: new Date(),
    added_by_role: 'admin',
    is_organic: toBool(body.is_organic) || toBool(body.isOrganic),
    shelf_life_days: body.shelf_life_days || null,
    tags: parseTags(body.tags),
    packs: parsePacks(body.packs),
    user_id: adminId,
    is_draft: false
  });

  if (files && files.length > 0) {
    await Promise.all(files.map((file, index) =>
      ProductImage.create({
        product_id: product.id,
        image_url: `/uploads/${file.filename}`,
        is_primary: index === 0,
        sort_order: index
      })
    ));
  }

  return product.reload({
    include: [
      { model: Category, as: 'category', attributes: ['id', 'name', 'slug'] },
      { model: ProductImage, as: 'images', attributes: ['id', 'image_url', 'is_primary', 'sort_order'] }
    ]
  });
};

const updateShopProduct = async (productId, body, files, adminId) => {
  const product = await Product.findOne({ where: { uuid: productId } });
  if (!product) throw new AppError('Product not found', 404, 'NOT_FOUND');

  const allowedUpdates = {};
  if (body.name !== undefined) allowedUpdates.name = body.name;
  if (body.description !== undefined) allowedUpdates.description = body.description;
  if (body.unit !== undefined) allowedUpdates.unit = body.unit;
  if (body.price_per_unit !== undefined) allowedUpdates.price_per_unit = body.price_per_unit;
  if (body.available_quantity !== undefined) allowedUpdates.available_quantity = body.available_quantity;
  if (body.minimum_order_qty !== undefined) allowedUpdates.minimum_order_qty = body.minimum_order_qty;
  if (body.category_id !== undefined) allowedUpdates.category_id = body.category_id;
  else if (body.categoryId !== undefined) allowedUpdates.category_id = body.categoryId;
  if (body.is_organic !== undefined) allowedUpdates.is_organic = toBool(body.is_organic);
  else if (body.isOrganic !== undefined) allowedUpdates.is_organic = toBool(body.isOrganic);
  if (body.shelf_life_days !== undefined) allowedUpdates.shelf_life_days = body.shelf_life_days;
  if (body.status !== undefined) allowedUpdates.status = body.status;
  if (body.tags !== undefined) allowedUpdates.tags = parseTags(body.tags);
  if (body.packs !== undefined) allowedUpdates.packs = parsePacks(body.packs);

  await product.update(allowedUpdates);

  if (files && files.length > 0) {
    await Promise.all(files.map((file, index) =>
      ProductImage.create({
        product_id: product.id,
        image_url: `/uploads/${file.filename}`,
        is_primary: false,
        sort_order: index
      })
    ));
  }

  return product.reload({
    include: [
      { model: Category, as: 'category', attributes: ['id', 'name', 'slug'] },
      { model: ProductImage, as: 'images', attributes: ['id', 'image_url', 'is_primary', 'sort_order'] }
    ]
  });
};

const deleteShopProduct = async (productId) => {
  const product = await Product.findOne({ where: { uuid: productId } });
  if (!product) throw new AppError('Product not found', 404, 'NOT_FOUND');
  await product.destroy(); // paranoid soft-delete — removes it from all listings
  return { message: 'Product deleted successfully' };
};

// Admin-managed shop products across every status (active/inactive/etc.) so the
// admin can still see and re-activate products that are hidden from the store.
const getAdminShopProducts = async (query) => {
  const { page, limit, offset } = getPaginationParams(query);
  const where = { added_by_role: 'admin' };
  if (query.status) where.status = query.status;
  if (query.search) where.name = { [Op.like]: `%${query.search}%` };

  const { count, rows } = await Product.findAndCountAll({
    where,
    include: [
      { model: Category, as: 'category', attributes: ['id', 'name', 'slug'] },
      { model: ProductImage, as: 'images', attributes: ['id', 'image_url', 'is_primary', 'sort_order'] }
    ],
    limit, offset, order: [['created_at', 'DESC']], distinct: true
  });
  return { products: rows, pagination: buildPaginationMeta(count, page, limit) };
};

const getShopOrders = async (query) => {
  const { ShopOrder, ShopOrderItem, User } = require('../../models');
  const { page, limit, offset } = getPaginationParams(query);
  const where = {};
  if (query.status) where.status = query.status;

  const { count, rows } = await ShopOrder.findAndCountAll({
    where,
    include: [
      { model: ShopOrderItem, as: 'items' },
      { model: User, as: 'customer', attributes: ['uuid', 'name', 'email', 'mobile', 'created_at'], required: false }
    ],
    limit, offset, order: [['created_at', 'DESC']], distinct: true
  });

  return { orders: rows, pagination: buildPaginationMeta(count, page, limit) };
};

const updateShopOrderStatus = async (orderId, status, adminId) => {
  const { ShopOrder } = require('../../models');
  const sse = require('../../utils/sseManager');
  const order = await ShopOrder.findOne({ where: { uuid: orderId } });
  if (!order) throw new AppError('Shop order not found', 404, 'NOT_FOUND');
  await order.update({ status });
  const userId = order.user_id ? String(order.user_id) : null;
  sse.emit(order.uuid, userId, { type: 'status_update', orderUuid: order.uuid, status });
  return order;
};

// --- Categories ----------------------------------------------------------
// Every category (active + inactive) with a live product count, so the admin
// can decide what to switch on/off for launch. Unlike the public
// getShopCategories, this is not filtered by is_active.
const getAdminCategories = async () => {
  const { fn, col } = require('sequelize');
  return Category.findAll({
    include: [{
      model: Product,
      required: false,
      where: { status: 'active', is_approved: true, is_draft: false },
      attributes: []
    }],
    attributes: {
      include: [[fn('COUNT', col('Products.id')), 'products_count']]
    },
    group: ['Category.id'],
    order: [['sort_order', 'ASC'], ['name', 'ASC']]
  });
};

// Toggle a category on/off for the storefront (launch gating). Keyed by id.
const setCategoryActive = async (categoryId, isActive) => {
  const category = await Category.findByPk(categoryId);
  if (!category) throw new AppError('Category not found', 404, 'NOT_FOUND');
  await category.update({ is_active: toBool(isActive) });
  return category;
};

module.exports = { getDashboardStats, getUsers, updateUserStatus, reviewDocument, reviewVerificationStep, getAdminProducts, approveProduct, rejectProduct, getProcurements, createProcurement, updateProcurementStatus, createResaleListing, getResaleListings, createShopProduct, updateShopProduct, deleteShopProduct, getAdminShopProducts, getShopOrders, updateShopOrderStatus, getAdminCategories, setCategoryActive };
