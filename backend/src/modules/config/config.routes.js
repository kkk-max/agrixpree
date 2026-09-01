const router = require('express').Router();
const service = require('./config.service');
const { sendSuccess } = require('../../utils/response');

router.get('/pincodes', async (req, res, next) => {
  try { sendSuccess(res, await service.getActivePincodes()); } catch (err) { next(err); }
});

module.exports = router;
