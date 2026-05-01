const { Product, ProductImage, Category, User, FarmerProfile } = require('../../models');
const { getPaginationParams, buildPaginationMeta } = require('../../utils/pagination');
const { Op } = require('sequelize');

const getPublicProducts = async (query) => {
  const { page, limit, offset, order } = getPaginationParams(query);
  const where = { status: 'active', is_draft: false, is_approved: true };

  if (query.categoryId) where.category_id = query.categoryId;
  if (query.search) where.name = { [Op.like]: `%${query.search}%` };
  if (query.qualityGrade) where.quality_grade = query.qualityGrade;
  if (query.isOrganic === 'true') where.is_organic = true;
  if (query.state) where.origin_state = query.state;
  if (query.minPrice || query.maxPrice) {
    where.price_per_unit = {};
    if (query.minPrice) where.price_per_unit[Op.gte] = parseFloat(query.minPrice);
    if (query.maxPrice) where.price_per_unit[Op.lte] = parseFloat(query.maxPrice);
  }

  const sortMap = { price: 'price_per_unit', date: 'created_at', name: 'name' };
  const sortField = sortMap[query.sort] || 'created_at';

  const { count, rows } = await Product.findAndCountAll({
    where,
    include: [
      { model: Category, as: 'category', attributes: ['id', 'name', 'slug'] },
      { model: ProductImage, as: 'images', attributes: ['id', 'image_url', 'thumbnail_url', 'is_primary'], where: { is_primary: true }, required: false },
      { model: User, as: 'farmer', attributes: ['id', 'uuid', 'name'], include: [{ model: FarmerProfile, as: 'farmerProfile', attributes: ['state', 'district', 'farm_name'] }] }
    ],
    limit, offset, order: [[sortField, order]], distinct: true
  });

  return { products: rows, pagination: buildPaginationMeta(count, page, limit) };
};

const getPublicProductById = async (id) => {
  return Product.findOne({
    where: { uuid: id, status: 'active', is_approved: true },
    include: [
      { model: Category, as: 'category' },
      { model: ProductImage, as: 'images' },
      { model: User, as: 'farmer', attributes: ['id', 'uuid', 'name', 'mobile'], include: [{ model: FarmerProfile, as: 'farmerProfile' }] }
    ]
  });
};

const getCategories = async () => {
  return Category.findAll({
    where: { is_active: true, parent_id: null },
    include: [{ model: Category, as: 'subcategories', where: { is_active: true }, required: false }],
    order: [['sort_order', 'ASC']]
  });
};

module.exports = { getPublicProducts, getPublicProductById, getCategories };
