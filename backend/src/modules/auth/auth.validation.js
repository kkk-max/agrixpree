const Joi = require('joi');

const register = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  mobile: Joi.string().pattern(/^[6-9]\d{9}$/).required().messages({ 'string.pattern.base': 'Enter a valid 10-digit Indian mobile number' }),
  email: Joi.string().email().optional().allow(''),
  password: Joi.string().min(8).required(),
  role: Joi.string().valid('farmer', 'buyer').required()
});

const verifyOtp = Joi.object({
  mobile: Joi.string().required(),
  code: Joi.string().length(6).required(),
  purpose: Joi.string().valid('registration', 'login', 'password_reset').required()
});

const login = Joi.object({
  mobile: Joi.string().required(),
  password: Joi.string().required()
});

const forgotPassword = Joi.object({ mobile: Joi.string().required() });

const resetPassword = Joi.object({
  mobile: Joi.string().required(),
  code: Joi.string().length(6).required(),
  password: Joi.string().min(8).required()
});

const refreshToken = Joi.object({ refreshToken: Joi.string().required() });

module.exports = { register, verifyOtp, login, forgotPassword, resetPassword, refreshToken };
