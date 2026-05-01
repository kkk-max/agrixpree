const router = require('express').Router();
const { authenticate } = require('../../middleware/auth');
const { upload } = require('../../middleware/upload');
const { uploadLimiter } = require('../../middleware/rateLimiter');
const { sendSuccess, sendError } = require('../../utils/response');
const { Document, VerificationStep, User } = require('../../models');

router.use(authenticate);

router.post('/documents', uploadLimiter, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return sendError(res, 'File required', 'VALIDATION_ERROR', 400);
    const { documentType, stepNumber } = req.body;
    if (!documentType) return sendError(res, 'documentType required', 'VALIDATION_ERROR', 400);

    const doc = await Document.create({
      user_id: req.user.id,
      document_type: documentType,
      file_url: `/uploads/${req.file.filename}`,
      file_name: req.file.originalname,
      file_size: req.file.size,
      mime_type: req.file.mimetype,
      status: 'pending'
    });

    if (stepNumber) {
      await VerificationStep.update(
        { status: 'submitted', submitted_at: new Date() },
        { where: { user_id: req.user.id, step_number: stepNumber } }
      );
      await User.update({ kyc_status: 'in_progress' }, { where: { id: req.user.id } });
    }

    sendSuccess(res, doc, 'Document uploaded', 201);
  } catch (err) { next(err); }
});

router.get('/status', async (req, res, next) => {
  try {
    const steps = await VerificationStep.findAll({ where: { user_id: req.user.id }, order: [['step_number', 'ASC']] });
    const docs = await Document.findAll({ where: { user_id: req.user.id }, order: [['created_at', 'DESC']] });
    const user = await User.findByPk(req.user.id, { attributes: ['kyc_status', 'is_verified'] });
    sendSuccess(res, { kycStatus: user.kyc_status, isVerified: user.is_verified, steps, documents: docs });
  } catch (err) { next(err); }
});

module.exports = router;
