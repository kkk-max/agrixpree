const { v4: uuidv4 } = require('uuid');
const path = require('path');
const { Product, ProductImage, Category, User, FarmerProfile } = require('../../models');
const { AppError } = require('../../middleware/errorHandler');
const { getPaginationParams, buildPaginationMeta } = require('../../utils/pagination');
const { Op } = require('sequelize');

const buildSlug = (name) => name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now();

const productIncludes = [
  { model: Category, as: 'category', attributes: ['id', 'name', 'slug'] },
  { model: ProductImage, as: 'images', attributes: ['id', 'image_url', 'thumbnail_url', 'sort_order', 'is_primary'] },
  { model: User, as: 'farmer', attributes: ['id', 'uuid', 'name'], include: [{ model: FarmerProfile, as: 'farmerProfile', attributes: ['state', 'district', 'farm_name'] }] }
];

const createProduct = async (userId, role, data, files = []) => {
  const status = role === 'admin' ? 'active' : (data.isDraft ? 'draft' : 'pending_approval');
  const is_approved = role === 'admin';

  const product = await Product.create({
    uuid: uuidv4(),
    user_id: userId,
    category_id: data.categoryId,
    name: data.name,
    slug: buildSlug(data.name),
    description: data.description,
    unit: data.unit,
    price_per_unit: data.pricePerUnit,
    available_quantity: data.availableQuantity,
    minimum_order_qty: data.minimumOrderQty || 1,
    status,
    is_draft: data.isDraft || false,
    expected_harvest_date: data.expectedHarvestDate || null,
    sowing_date: data.sowingDate || null,
    draft_notes: data.draftNotes || null,
    origin_state: data.originState || null,
    origin_district: data.originDistrict || null,
    is_organic: data.isOrganic || false,
    shelf_life_days: data.shelfLifeDays || null,
    added_by_role: role,
    is_approved
  });

  if (files.length > 0) {
    const images = files.map((f, i) => ({
      product_id: product.id,
      image_url: `/uploads/${f.filename}`,
      thumbnail_url: `/uploads/${f.filename}`,
      sort_order: i,
      is_primary: i === 0
    }));
    await ProductImage.bulkCreate(images);
  }

  return product.reload({ include: productIncludes });
};

const getProducts = async (userId, role, query) => {
  const { page, limit, offset, order } = getPaginationParams(query);
  const where = {};

  if (role === 'farmer') where.user_id = userId;
  if (query.status) where.status = query.status;
  if (query.isDraft !== undefined) where.is_draft = query.isDraft === 'true';
  if (query.categoryId) where.category_id = query.categoryId;
  if (query.search) where.name = { [Op.like]: `%${query.search}%` };

  const { count, rows } = await Product.findAndCountAll({
    where,
    include: productIncludes,
    limit,
    offset,
    order: [['created_at', order]],
    distinct: true
  });

  return { products: rows, pagination: buildPaginationMeta(count, page, limit) };
};

const getProductById = async (id, userId, role) => {
  const where = { uuid: id };
  if (role === 'farmer') where.user_id = userId;

  const product = await Product.findOne({ where, include: productIncludes });
  if (!product) throw new AppError('Product not found', 404, 'NOT_FOUND');
  return product;
};

const updateProduct = async (id, userId, role, data) => {
  const where = { uuid: id };
  if (role === 'farmer') where.user_id = userId;

  const product = await Product.findOne({ where });
  if (!product) throw new AppError('Product not found', 404, 'NOT_FOUND');

  const updates = {};
  if (data.name) { updates.name = data.name; updates.slug = buildSlug(data.name); }
  if (data.categoryId) updates.category_id = data.categoryId;
  if (data.description !== undefined) updates.description = data.description;
  if (data.unit) updates.unit = data.unit;
  if (data.pricePerUnit) updates.price_per_unit = data.pricePerUnit;
  if (data.availableQuantity !== undefined) updates.available_quantity = data.availableQuantity;
  if (data.minimumOrderQty) updates.minimum_order_qty = data.minimumOrderQty;
  if (data.isDraft !== undefined) {
    updates.is_draft = data.isDraft;
    if (!data.isDraft && product.is_draft) updates.status = 'pending_approval';
  }
  if (data.expectedHarvestDate !== undefined) updates.expected_harvest_date = data.expectedHarvestDate;
  if (data.sowingDate !== undefined) updates.sowing_date = data.sowingDate;
  if (data.draftNotes !== undefined) updates.draft_notes = data.draftNotes;
  if (data.originState !== undefined) updates.origin_state = data.originState;
  if (data.originDistrict !== undefined) updates.origin_district = data.originDistrict;
  if (data.isOrganic !== undefined) updates.is_organic = data.isOrganic;
  if (data.shelfLifeDays !== undefined) updates.shelf_life_days = data.shelfLifeDays;
  if (data.status && role === 'admin') updates.status = data.status;

  await product.update(updates);
  return product.reload({ include: productIncludes });
};

const updateStock = async (id, userId, role, { availableQuantity }) => {
  const where = { uuid: id };
  if (role === 'farmer') where.user_id = userId;

  const product = await Product.findOne({ where });
  if (!product) throw new AppError('Product not found', 404, 'NOT_FOUND');

  const newStatus = availableQuantity === 0 ? 'out_of_stock' : (product.status === 'out_of_stock' ? 'active' : product.status);
  await product.update({ available_quantity: availableQuantity, status: newStatus });
  return { uuid: product.uuid, availableQuantity, status: product.status };
};

const deleteProduct = async (id, userId, role) => {
  const where = { uuid: id };
  if (role === 'farmer') where.user_id = userId;

  const product = await Product.findOne({ where });
  if (!product) throw new AppError('Product not found', 404, 'NOT_FOUND');

  await product.update({ status: 'archived' });
  await product.destroy();
  return { message: 'Product archived' };
};

module.exports = { createProduct, getProducts, getProductById, updateProduct, updateStock, deleteProduct };
