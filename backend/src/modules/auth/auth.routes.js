const router = require('express').Router();
const controller = require('./auth.controller');
const { validate } = require('../../middleware/validate');
const { authLimiter } = require('../../middleware/rateLimiter');
const v = require('./auth.validation');

router.post('/register', authLimiter, validate(v.register), controller.register);
router.post('/verify-otp', authLimiter, validate(v.verifyOtp), controller.verifyOtp);
router.post('/login', authLimiter, validate(v.login), controller.login);
router.post('/refresh-token', controller.refreshToken);
router.post('/logout', controller.logout);
router.post('/forgot-password', authLimiter, validate(v.forgotPassword), controller.forgotPassword);
router.post('/reset-password', authLimiter, validate(v.resetPassword), controller.resetPassword);

module.exports = router;
