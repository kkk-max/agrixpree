const logger = require('../utils/logger');

class AppError extends Error {
  constructor(message, statusCode = 500, errorCode = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true;
  }
}

const errorHandler = (err, req, res, next) => {
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      error: { code: err.errorCode, message: err.message }
    });
  }

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ success: false, error: { code: 'FILE_TOO_LARGE', message: 'File too large. Maximum size is 10MB per image.' } });
  }
  if (err.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({ success: false, error: { code: 'TOO_MANY_FILES', message: 'Too many files. Maximum 5 images allowed.' } });
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({ success: false, error: { code: 'UNEXPECTED_FILE', message: 'Unexpected file field.' } });
  }

  // Sequelize validation errors
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    const details = err.errors?.map(e => ({ field: e.path, message: e.message }));
    return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Validation failed', details } });
  }

  logger.error('Unhandled error', { error: err.message, stack: err.stack, path: req.path });
  return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } });
};

module.exports = { AppError, errorHandler };
