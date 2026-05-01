const authService = require('./auth.service');
const { sendSuccess, sendError } = require('../../utils/response');

const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    sendSuccess(res, result, 'Registration successful. OTP sent to mobile.', 201);
  } catch (err) { next(err); }
};

const verifyOtp = async (req, res, next) => {
  try {
    const result = await authService.verifyOtp(req.body);
    sendSuccess(res, result, 'OTP verified');
  } catch (err) { next(err); }
};

const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    res.cookie('refreshToken', result.refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000 });
    sendSuccess(res, { accessToken: result.accessToken, user: result.user }, 'Login successful');
  } catch (err) { next(err); }
};

const refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!token) return sendError(res, 'Refresh token required', 'UNAUTHORIZED', 401);
    const result = await authService.refreshToken(token);
    res.cookie('refreshToken', result.refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000 });
    sendSuccess(res, { accessToken: result.accessToken }, 'Token refreshed');
  } catch (err) { next(err); }
};

const logout = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    if (token) await authService.logout(token);
    res.clearCookie('refreshToken');
    sendSuccess(res, null, 'Logged out');
  } catch (err) { next(err); }
};

const forgotPassword = async (req, res, next) => {
  try {
    const result = await authService.forgotPassword(req.body);
    sendSuccess(res, null, result.message);
  } catch (err) { next(err); }
};

const resetPassword = async (req, res, next) => {
  try {
    const result = await authService.resetPassword(req.body);
    sendSuccess(res, null, result.message);
  } catch (err) { next(err); }
};

module.exports = { register, verifyOtp, login, refreshToken, logout, forgotPassword, resetPassword };
