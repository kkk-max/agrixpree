const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { AppError } = require('./errorHandler');

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/bmp',
  'image/tiff',
  'image/tif',
  'image/svg+xml',
  'image/avif',
  'image/heic',
  'image/heif',
  'application/pdf'
];

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, process.env.UPLOAD_DIR || 'uploads'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}-${Date.now()}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (ALLOWED_TYPES.includes(file.mimetype)) cb(null, true);
  else cb(new AppError('Only image files (JPG, PNG, WebP, GIF, BMP, TIFF, SVG, AVIF, HEIC) and PDF are allowed', 400, 'INVALID_FILE_TYPE'), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760') }
});

module.exports = { upload };
