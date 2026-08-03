const router = require('express').Router();
const service = require('./admin.service');
const { sendSuccess } = require('../../utils/response');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/rbac');
const { Document, VerificationStep, User } = require('../../models');
const { upload } = require('../../middleware/upload');

router.use(authenticate, authorize('admin'));

router.get('/dashboard', async (req, res, next) => {
  try { sendSuccess(res, await service.getDashboardStats()); } catch (err) { next(err); }
});

router.get('/users', async (req, res, next) => {
  try {
    const { users, pagination } = await service.getUsers(req.query);
    sendSuccess(res, users, 'Users fetched', 200, pagination);
  } catch (err) { next(err); }
});

router.put('/users/:id/status', async (req, res, next) => {
  try { sendSuccess(res, await service.updateUserStatus(req.params.id, req.body, req.user.id)); }
  catch (err) { next(err); }
});

router.get('/kyc/pending', async (req, res, next) => {
  try {
    const users = await User.findAll({
      where: { kyc_status: ['pending', 'in_progress'] },
      include: [{ model: require('../../models').Document, as: 'documents' }, { model: require('../../models').VerificationStep, as: 'verificationSteps' }]
    });
    sendSuccess(res, users);
  } catch (err) { next(err); }
});

router.put('/kyc/document/:documentId', async (req, res, next) => {
  try { sendSuccess(res, await service.reviewDocument(req.params.documentId, req.body, req.user.id)); }
  catch (err) { next(err); }
});

router.put('/kyc/step/:userId/:stepNumber', async (req, res, next) => {
  try { sendSuccess(res, await service.reviewVerificationStep(req.params.userId, parseInt(req.params.stepNumber), req.body, req.user.id)); }
  catch (err) { next(err); }
});

// Products
router.get('/products', async (req, res, next) => {
  try {
    const { products, pagination } = await service.getAdminProducts(req.query);
    sendSuccess(res, products, 'Products fetched', 200, pagination);
  } catch (err) { next(err); }
});

router.patch('/products/:id/approve', async (req, res, next) => {
  try { sendSuccess(res, await service.approveProduct(req.params.id, req.user.id)); }
  catch (err) { next(err); }
});

router.patch('/products/:id/reject', async (req, res, next) => {
  try { sendSuccess(res, await service.rejectProduct(req.params.id, req.body, req.user.id)); }
  catch (err) { next(err); }
});

// Procurement
router.get('/procurements', async (req, res, next) => {
  try {
    const { procurements, pagination } = await service.getProcurements(req.query);
    sendSuccess(res, procurements, 'Procurements fetched', 200, pagination);
  } catch (err) { next(err); }
});

router.post('/procurements', async (req, res, next) => {
  try { sendSuccess(res, await service.createProcurement(req.body, req.user.id), 'Procurement created', 201); }
  catch (err) { next(err); }
});

router.patch('/procurements/:id/status', async (req, res, next) => {
  try { sendSuccess(res, await service.updateProcurementStatus(req.params.id, req.body, req.user.id)); }
  catch (err) { next(err); }
});

// Resale listings
router.get('/resale-listings', async (req, res, next) => {
  try {
    const { listings, pagination } = await service.getResaleListings(req.query);
    sendSuccess(res, listings, 'Resale listings fetched', 200, pagination);
  } catch (err) { next(err); }
});

router.post('/procurements/:id/relist', async (req, res, next) => {
  try { sendSuccess(res, await service.createResaleListing(req.params.id, req.body, req.user.id), 'Resale listing created', 201); }
  catch (err) { next(err); }
});

// Shop Product CRUD
router.get('/shop/products', async (req, res, next) => {
  try {
    const { products, pagination } = await service.getAdminShopProducts(req.query);
    sendSuccess(res, products, 'Shop products fetched', 200, pagination);
  } catch (err) { next(err); }
});

router.post('/shop/products', upload.array('images', 10), async (req, res, next) => {
  try { sendSuccess(res, await service.createShopProduct(req.body, req.files, req.user.id), 'Shop product created', 201); }
  catch (err) { next(err); }
});

router.put('/shop/products/:id', upload.array('images', 10), async (req, res, next) => {
  try { sendSuccess(res, await service.updateShopProduct(req.params.id, req.body, req.files, req.user.id)); }
  catch (err) { next(err); }
});

router.delete('/shop/products/:id', async (req, res, next) => {
  try { sendSuccess(res, await service.deleteShopProduct(req.params.id)); }
  catch (err) { next(err); }
});

// Categories (launch gating via is_active)
router.get('/shop/categories', async (req, res, next) => {
  try { sendSuccess(res, await service.getAdminCategories(), 'Categories fetched'); }
  catch (err) { next(err); }
});

router.patch('/shop/categories/:id/active', async (req, res, next) => {
  try { sendSuccess(res, await service.setCategoryActive(req.params.id, req.body.is_active), 'Category updated'); }
  catch (err) { next(err); }
});

// Shop Orders
router.get('/shop/orders', async (req, res, next) => {
  try {
    const { orders, pagination } = await service.getShopOrders(req.query);
    sendSuccess(res, orders, 'Shop orders fetched', 200, pagination);
  } catch (err) { next(err); }
});

router.patch('/shop/orders/:id/status', async (req, res, next) => {
  try { sendSuccess(res, await service.updateShopOrderStatus(req.params.id, req.body.status, req.user.id)); }
  catch (err) { next(err); }
});

module.exports = router;
