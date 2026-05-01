const router = require('express').Router();
const service = require('./notification.service');
const { sendSuccess } = require('../../utils/response');
const { authenticate } = require('../../middleware/auth');

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const result = await service.getNotifications(req.user.id, req.query);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
});

router.put('/:id/read', async (req, res, next) => {
  try { await service.markRead(req.params.id, req.user.id); sendSuccess(res, null, 'Marked read'); }
  catch (err) { next(err); }
});

router.put('/read-all', async (req, res, next) => {
  try { await service.markAllRead(req.user.id); sendSuccess(res, null, 'All notifications marked read'); }
  catch (err) { next(err); }
});

module.exports = router;
