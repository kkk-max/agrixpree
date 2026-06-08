const Joi = require('joi');

const register = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  mobile: Joi.string().pattern(/^[6-9]\d{9}$/).optional().allow('').messages({ 'string.pattern.base': 'Enter a valid 10-digit Indian mobile number' }),
  password: Joi.string().min(8).required(),
  role: Joi.string().valid('farmer', 'buyer').required()
});

const verifyOtp = Joi.object({
  email: Joi.string().email().required(),
  code: Joi.string().length(6).required(),
  purpose: Joi.string().valid('registration', 'login', 'password_reset').required()
});

const login = Joi.object({
  mobile: Joi.string().required(),
  password: Joi.string().required()
});

const forgotPassword = Joi.object({ email: Joi.string().email().required() });

const resetPassword = Joi.object({
  email: Joi.string().email().required(),
  code: Joi.string().length(6).required(),
  password: Joi.string().min(8).required()
});

const refreshToken = Joi.object({ refreshToken: Joi.string().required() });

module.exports = { register, verifyOtp, login, forgotPassword, resetPassword, refreshToken };
