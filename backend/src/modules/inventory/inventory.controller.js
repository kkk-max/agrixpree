const service = require('./inventory.service');
const { sendSuccess } = require('../../utils/response');

const createProduct = async (req, res, next) => {
  try {
    const product = await service.createProduct(req.user.id, req.user.role, req.body, req.files || []);
    sendSuccess(res, product, 'Product created', 201);
  } catch (err) { next(err); }
};

const getProducts = async (req, res, next) => {
  try {
    const { products, pagination } = await service.getProducts(req.user.id, req.user.role, req.query);
    sendSuccess(res, products, 'Products fetched', 200, pagination);
  } catch (err) { next(err); }
};

const getProductById = async (req, res, next) => {
  try {
    const product = await service.getProductById(req.params.id, req.user.id, req.user.role);
    sendSuccess(res, product);
  } catch (err) { next(err); }
};

const updateProduct = async (req, res, next) => {
  try {
    const product = await service.updateProduct(req.params.id, req.user.id, req.user.role, req.body);
    sendSuccess(res, product, 'Product updated');
  } catch (err) { next(err); }
};

const updateStock = async (req, res, next) => {
  try {
    const result = await service.updateStock(req.params.id, req.user.id, req.user.role, req.body);
    sendSuccess(res, result, 'Stock updated');
  } catch (err) { next(err); }
};

const deleteProduct = async (req, res, next) => {
  try {
    await service.deleteProduct(req.params.id, req.user.id, req.user.role);
    sendSuccess(res, null, 'Product archived');
  } catch (err) { next(err); }
};

module.exports = { createProduct, getProducts, getProductById, updateProduct, updateStock, deleteProduct };
