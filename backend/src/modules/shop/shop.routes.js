const router = require('express').Router();
const shopService = require('./shop.service');
const { sendSuccess } = require('../../utils/response');
const { optionalAuth, authenticate } = require('../../middleware/auth');
const sse = require('../../utils/sseManager');

router.get('/categories', async (req, res, next) => {
  try {
    sendSuccess(res, await shopService.getShopCategories(), 'Categories fetched');
  } catch (err) { next(err); }
});

router.get('/', async (req, res, next) => {
  try {
    const { products, pagination } = await shopService.getShopProducts(req.query);
    sendSuccess(res, products, 'Products fetched', 200, pagination);
  } catch (err) { next(err); }
});

// All static/specific paths must be declared before '/:id' to avoid capture.
router.get('/my-orders', authenticate, async (req, res, next) => {
  try {
    sendSuccess(res, await shopService.getMyOrders(req.user.id), 'Orders fetched');
  } catch (err) { next(err); }
});

// SSE: all active orders for a logged-in user (AccountPage)
router.get('/my-orders/stream', authenticate, (req, res) => {
  const userId = String(req.user.id);

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const heartbeat = setInterval(() => { try { res.write(': ping\n\n'); } catch (_) { clearInterval(heartbeat); } }, 25000);

  const SENTINEL = `__user__${userId}`;
  sse.subscribe(SENTINEL, userId, res);

  req.on('close', () => {
    clearInterval(heartbeat);
    sse.unsubscribe(SENTINEL, userId, res);
  });
});

router.post('/orders', optionalAuth, async (req, res, next) => {
  try {
    sendSuccess(res, await shopService.placeOrder(req.body, req.user?.id || null), 'Order placed successfully', 201);
  } catch (err) { next(err); }
});

// SSE: single order (guest or logged-in)
router.get('/orders/:uuid/stream', optionalAuth, (req, res) => {
  const { uuid } = req.params;
  const userId = req.user?.id ? String(req.user.id) : null;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const heartbeat = setInterval(() => { try { res.write(': ping\n\n'); } catch (_) { clearInterval(heartbeat); } }, 25000);

  sse.subscribe(uuid, userId, res);

  req.on('close', () => {
    clearInterval(heartbeat);
    sse.unsubscribe(uuid, userId, res);
  });
});

router.get('/:id', async (req, res, next) => {
  try {
    sendSuccess(res, await shopService.getShopProductById(req.params.id), 'Product fetched');
  } catch (err) { next(err); }
});

module.exports = router;
