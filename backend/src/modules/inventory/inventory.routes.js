const router = require('express').Router();
const controller = require('./inventory.controller');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/rbac');
const { validate } = require('../../middleware/validate');
const { upload } = require('../../middleware/upload');
const { uploadLimiter } = require('../../middleware/rateLimiter');
const v = require('./inventory.validation');

router.use(authenticate);

router.post('/', authorize('farmer', 'admin'), uploadLimiter, upload.array('images', 5), validate(v.createProduct), controller.createProduct);
router.get('/', authorize('farmer', 'admin'), controller.getProducts);
router.get('/:id', authenticate, controller.getProductById);
router.put('/:id', authorize('farmer', 'admin'), validate(v.updateProduct), controller.updateProduct);
router.patch('/:id/stock', authorize('farmer', 'admin'), validate(v.updateStock), controller.updateStock);
router.delete('/:id', authorize('farmer', 'admin'), controller.deleteProduct);

module.exports = router;
