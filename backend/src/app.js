require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const { generalLimiter } = require('./middleware/rateLimiter');
const { errorHandler } = require('./middleware/errorHandler');
const logger = require('./utils/logger');

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(generalLimiter);

// Static uploads
app.use('/uploads', express.static(path.join(process.cwd(), process.env.UPLOAD_DIR || 'uploads')));

// Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// API Routes
const v1 = express.Router();
v1.use('/auth', require('./modules/auth/auth.routes'));
v1.use('/profile', require('./modules/user/user.routes'));
v1.use('/kyc', require('./modules/kyc/kyc.routes'));
v1.use('/inventory/products', require('./modules/inventory/inventory.routes'));
v1.use('/products', require('./modules/products/products.routes'));
v1.use('/notifications', require('./modules/notification/notification.routes'));
v1.use('/admin', require('./modules/admin/admin.routes'));

app.use('/api/v1', v1);

// 404
app.use((req, res) => res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Route not found' } }));

app.use(errorHandler);

module.exports = app;
