const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({ windowMs: 60 * 1000, max: 10, message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests, slow down' } } });
const generalLimiter = rateLimit({ windowMs: 60 * 1000, max: 100 });
const uploadLimiter = rateLimit({ windowMs: 60 * 1000, max: 20 });

module.exports = { authLimiter, generalLimiter, uploadLimiter };
