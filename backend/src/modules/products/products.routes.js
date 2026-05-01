const router = require('express').Router();
const service = require('./products.service');
const { sendSuccess, sendError } = require('../../utils/response');
const { authenticate } = require('../../middleware/auth');

router.get('/categories', async (req, res, next) => {
  try { sendSuccess(res, await service.getCategories()); } catch (err) { next(err); }
});

router.get('/', authenticate, async (req, res, next) => {
  try {
    const { products, pagination } = await service.getPublicProducts(req.query);
    sendSuccess(res, products, 'Products fetched', 200, pagination);
  } catch (err) { next(err); }
});

router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const p = await service.getPublicProductById(req.params.id);
    if (!p) return sendError(res, 'Product not found', 'NOT_FOUND', 404);
    sendSuccess(res, p);
  } catch (err) { next(err); }
});

module.exports = router;
