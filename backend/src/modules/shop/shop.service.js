const { Product, ProductImage, Category, ShopOrder, ShopOrderItem, User, Pincode } = require('../../models');
const { Op, where: sequelizeWhere, cast, col } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const { getPaginationParams, buildPaginationMeta } = require('../../utils/pagination');
const { AppError } = require('../../middleware/errorHandler');
const { FREE_DELIVERY_THRESHOLD, DELIVERY_FEE, HANDLING_CHARGE_PERCENT } = require('../../config/constants');
const { effectiveMinOrder } = require('../../config/units');

const getShopProducts = async (query) => {
  const { page, limit, offset } = getPaginationParams(query);
  const where = { status: 'active', is_approved: true, is_draft: false };

  if (query.search) {
    // Case-insensitive match (Postgres LIKE is case-sensitive) across the
    // product name, description, and tags so the storefront search returns
    // the results a customer expects.
    const term = `%${query.search.trim()}%`;
    where[Op.or] = [
      { name: { [Op.iLike]: term } },
      { description: { [Op.iLike]: term } },
      sequelizeWhere(cast(col('Product.tags'), 'text'), { [Op.iLike]: term }),
    ];
  }

  const categoryWhere = {};
  if (query.category) categoryWhere.slug = query.category;

  const { count, rows } = await Product.findAndCountAll({
    where,
    include: [
      { model: Category, as: 'category', attributes: ['id', 'name', 'slug'], where: Object.keys(categoryWhere).length ? categoryWhere : undefined, required: !!query.category },
      { model: ProductImage, as: 'images', where: { is_primary: true }, required: false, attributes: ['id', 'image_url', 'is_primary'] }
    ],
    limit, offset, order: [['created_at', 'DESC']], distinct: true
  });

  return { products: rows, pagination: buildPaginationMeta(count, page, limit) };
};

const getShopProductById = async (uuid) => {
  const product = await Product.findOne({
    where: { uuid, status: 'active', is_approved: true, is_draft: false },
    include: [
      { model: Category, as: 'category', attributes: ['id', 'name', 'slug'] },
      { model: ProductImage, as: 'images', attributes: ['id', 'image_url', 'thumbnail_url', 'sort_order', 'is_primary'] }
    ]
  });
  if (!product) throw new AppError('Product not found', 404, 'NOT_FOUND');
  return product;
};

const getShopCategories = async () => {
  const categories = await Category.findAll({
    where: { is_active: true },
    include: [{
      model: Product,
      where: { status: 'active', is_approved: true, is_draft: false },
      required: false,
      attributes: []
    }],
    attributes: {
      include: [
        [require('sequelize').fn('COUNT', require('sequelize').col('Products.id')), 'products_count']
      ]
    },
    group: ['Category.id'],
    order: [['sort_order', 'ASC'], ['name', 'ASC']]
  });
  return categories;
};

const placeOrder = async (body, userId = null) => {
  const { customerName, customerPhone, customerEmail, deliveryAddress, deliveryPincode, notes, items } = body;

  const servesPincode = await Pincode.findOne({ where: { pincode: String(deliveryPincode), is_active: true } });
  if (!servesPincode) {
    throw new AppError('Delivery not available for this pincode', 400, 'DELIVERY_UNAVAILABLE');
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new AppError('Order must contain at least one item', 400, 'EMPTY_ORDER');
  }

  let totalAmount = 0;
  const resolvedItems = [];

  for (const item of items) {
    const product = await Product.findOne({
      where: { uuid: item.productId, status: 'active', is_approved: true, is_draft: false }
    });
    if (!product) throw new AppError(`Product not found: ${item.productId}`, 404, 'NOT_FOUND');

    const requestedQty = parseFloat(item.quantity);
    if (!Number.isFinite(requestedQty) || requestedQty <= 0) {
      throw new AppError(`Invalid quantity for product: ${product.name}`, 400, 'INVALID_QTY');
    }

    const packs = Array.isArray(product.packs) ? product.packs : [];
    let unit, pricePerUnit;

    if (item.packId && packs.length) {
      // Weight-based product: price comes from the chosen fixed gram pack.
      const pack = packs.find(p => p.id === item.packId);
      if (!pack) throw new AppError(`Selected pack is no longer available for: ${product.name}`, 400, 'PACK_UNAVAILABLE');
      unit = pack.label;
      pricePerUnit = parseFloat(pack.price);
    } else {
      if (packs.length) {
        throw new AppError(`Please select a pack size for: ${product.name}`, 400, 'PACK_REQUIRED');
      }
      const minQty = effectiveMinOrder(product.unit, product.minimum_order_qty);
      if (requestedQty < minQty) {
        throw new AppError(`Minimum order for ${product.name} is ${minQty} ${product.unit}`, 400, 'BELOW_MIN_ORDER');
      }
      if (parseFloat(product.available_quantity) < requestedQty) {
        throw new AppError(`Insufficient stock for product: ${product.name}`, 400, 'INSUFFICIENT_STOCK');
      }
      unit = product.unit;
      pricePerUnit = parseFloat(product.price_per_unit);
    }

    const subtotal = parseFloat((pricePerUnit * requestedQty).toFixed(2));
    totalAmount += subtotal;

    resolvedItems.push({
      product_id: product.id,
      product_name: product.name,
      unit,
      price_per_unit: pricePerUnit,
      quantity: requestedQty,
      subtotal
    });
  }

  const itemsSubtotal = parseFloat(totalAmount.toFixed(2));
  const deliveryCharge = itemsSubtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  const handlingCharge = parseFloat((itemsSubtotal * HANDLING_CHARGE_PERCENT / 100).toFixed(2));
  const grandTotal = parseFloat((itemsSubtotal + deliveryCharge + handlingCharge).toFixed(2));

  const order = await ShopOrder.create({
    uuid: uuidv4(),
    user_id: userId,
    customer_name: customerName,
    customer_phone: customerPhone,
    customer_email: customerEmail || null,
    delivery_address: deliveryAddress,
    delivery_pincode: String(deliveryPincode),
    delivery_charge: deliveryCharge,
    handling_charge: handlingCharge,
    total_amount: grandTotal,
    status: 'pending',
    notes: notes || null
  });

  const orderItems = await ShopOrderItem.bulkCreate(
    resolvedItems.map(item => ({ ...item, order_id: order.id }))
  );

  // Remember the customer's delivery address on their profile for reuse.
  if (userId) {
    await User.update(
      { address: deliveryAddress, pincode: String(deliveryPincode) },
      { where: { id: userId } }
    );
  }

  const orderNumber = order.uuid.slice(0, 8).toUpperCase();
  require('../../utils/adminNotify').notifyAdmins({
    type: 'order', title: 'New Order Placed',
    message: `${customerName} placed order #${orderNumber} for ₹${grandTotal}.`,
    referenceId: order.id, referenceType: 'shop_order',
    url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/shop-orders`
  }).catch((err) => require('../../utils/logger').error(`Failed to notify admins of new order: ${err.message}`));

  return { ...order.toJSON(), items: orderItems };
};

const getMyOrders = async (userId) => {
  const orders = await ShopOrder.findAll({
    where: { user_id: userId },
    include: [{ model: ShopOrderItem, as: 'items' }],
    order: [['created_at', 'DESC']]
  });
  return orders;
};

module.exports = { getShopProducts, getShopProductById, getShopCategories, placeOrder, getMyOrders };
