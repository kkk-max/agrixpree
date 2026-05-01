const router = require('express').Router();
const { authenticate } = require('../../middleware/auth');
const { upload } = require('../../middleware/upload');
const { sendSuccess, sendError } = require('../../utils/response');
const { User, FarmerProfile, BuyerProfile, VerificationStep, Document } = require('../../models');

router.use(authenticate);

router.get('/me', async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password_hash'] },
      include: [
        { model: FarmerProfile, as: 'farmerProfile', required: false },
        { model: BuyerProfile, as: 'buyerProfile', required: false }
      ]
    });
    sendSuccess(res, user);
  } catch (err) { next(err); }
});

router.put('/me', async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (req.body.name) await user.update({ name: req.body.name });

    if (req.user.role === 'farmer' && req.body.farmerProfile) {
      await FarmerProfile.upsert({ user_id: req.user.id, ...req.body.farmerProfile });
    }
    if (req.user.role === 'buyer' && req.body.buyerProfile) {
      await BuyerProfile.upsert({ user_id: req.user.id, ...req.body.buyerProfile });
    }

    sendSuccess(res, null, 'Profile updated');
  } catch (err) { next(err); }
});

router.put('/avatar', upload.single('avatar'), async (req, res, next) => {
  try {
    if (!req.file) return sendError(res, 'No file uploaded', 'VALIDATION_ERROR', 400);
    const url = `/uploads/${req.file.filename}`;
    await User.update({ avatar_url: url }, { where: { id: req.user.id } });
    sendSuccess(res, { avatarUrl: url }, 'Avatar updated');
  } catch (err) { next(err); }
});

module.exports = router;
