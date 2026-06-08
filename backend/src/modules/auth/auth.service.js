const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const dayjs = require('dayjs');
const { User, OtpCode, RefreshToken, Wallet, FarmerProfile, BuyerProfile, VerificationStep } = require('../../models');
const { generateOTP, isExpired } = require('../../utils/otp');
const { AppError } = require('../../middleware/errorHandler');
const { BCRYPT_ROUNDS, OTP_TTL_MINUTES } = require('../../config/constants');
const logger = require('../../utils/logger');
const { sendOtpEmail } = require('../../utils/emailService');

const generateTokens = (user) => {
  const payload = { id: user.id, uuid: user.uuid, role: user.role, mobile: user.mobile };
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '15m' });
  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' });
  return { accessToken, refreshToken };
};

const register = async ({ name, mobile, email, password, role }) => {
  if (!email) throw new AppError('Email is required', 400, 'VALIDATION_ERROR');
  const existingEmail = await User.findOne({ where: { email } });
  if (existingEmail) throw new AppError('Email already registered', 409, 'CONFLICT');
  if (mobile) {
    const existingMobile = await User.findOne({ where: { mobile } });
    if (existingMobile) throw new AppError('Mobile number already registered', 409, 'CONFLICT');
  }

  const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const user = await User.create({ uuid: uuidv4(), name, mobile: mobile || null, email, password_hash, role });

  await Wallet.create({ user_id: user.id });

  if (role === 'farmer') {
    await FarmerProfile.create({ user_id: user.id });
    for (let i = 1; i <= 3; i++) {
      const names = { 1: 'govt_id', 2: 'land_docs', 3: 'crop_check' };
      await VerificationStep.create({ user_id: user.id, step_number: i, step_name: names[i] });
    }
  } else if (role === 'buyer') {
    await BuyerProfile.create({ user_id: user.id, buyer_type: 'personal' });
    for (let i = 1; i <= 3; i++) {
      const names = { 1: 'govt_id', 2: 'location', 3: 'credit_check' };
      await VerificationStep.create({ user_id: user.id, step_number: i, step_name: names[i] });
    }
  }

  const otp = generateOTP();
  const expires_at = dayjs().add(OTP_TTL_MINUTES, 'minute').toDate();
  await OtpCode.create({ email, mobile: mobile || null, code: otp, purpose: 'registration', expires_at });

  await sendOtpEmail({ to: email, otp, purpose: 'registration' });

  return { message: 'OTP sent to your email', userId: user.uuid };
};

const verifyOtp = async ({ email, code, purpose }) => {
  const otpRecord = await OtpCode.findOne({ where: { email, code, purpose, is_used: false }, order: [['created_at', 'DESC']] });
  if (!otpRecord) throw new AppError('Invalid OTP', 400, 'INVALID_OTP');
  if (isExpired(otpRecord.expires_at)) throw new AppError('OTP has expired', 400, 'OTP_EXPIRED');

  await otpRecord.update({ is_used: true });

  if (purpose === 'registration') {
    const user = await User.findOne({ where: { email } });
    if (user) await user.update({ is_verified: true });
  }

  return { verified: true };
};

const login = async ({ mobile, password }) => {
  const user = await User.findOne({ where: { mobile, is_active: true } });
  if (!user) throw new AppError('Invalid credentials', 401, 'UNAUTHORIZED');

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw new AppError('Invalid credentials', 401, 'UNAUTHORIZED');

  await user.update({ last_login_at: new Date() });

  const { accessToken, refreshToken } = generateTokens(user);
  const expires_at = dayjs().add(7, 'day').toDate();
  await RefreshToken.create({ user_id: user.id, token: refreshToken, expires_at });

  return { accessToken, refreshToken, user: { id: user.uuid, name: user.name, role: user.role, mobile: user.mobile, isVerified: user.is_verified, kycStatus: user.kyc_status } };
};

const refreshTokenService = async (token) => {
  let decoded;
  try { decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET); }
  catch { throw new AppError('Invalid refresh token', 401, 'UNAUTHORIZED'); }

  const stored = await RefreshToken.findOne({ where: { token, is_revoked: false } });
  if (!stored || isExpired(stored.expires_at)) throw new AppError('Refresh token expired', 401, 'UNAUTHORIZED');

  await stored.update({ is_revoked: true });

  const user = await User.findByPk(decoded.id);
  if (!user || !user.is_active) throw new AppError('User not found', 401, 'UNAUTHORIZED');

  const tokens = generateTokens(user);
  await RefreshToken.create({ user_id: user.id, token: tokens.refreshToken, expires_at: dayjs().add(7, 'day').toDate() });

  return tokens;
};

const logout = async (token) => {
  await RefreshToken.update({ is_revoked: true }, { where: { token } });
};

const forgotPassword = async ({ email }) => {
  const user = await User.findOne({ where: { email } });
  if (!user) throw new AppError('No account with this email', 404, 'NOT_FOUND');

  const otp = generateOTP();
  const expires_at = dayjs().add(OTP_TTL_MINUTES, 'minute').toDate();
  await OtpCode.create({ email, code: otp, purpose: 'password_reset', expires_at });

  await sendOtpEmail({ to: email, otp, purpose: 'password_reset' });
  return { message: 'OTP sent to your email' };
};

const resetPassword = async ({ email, code, password }) => {
  const otpRecord = await OtpCode.findOne({ where: { email, code, purpose: 'password_reset', is_used: false }, order: [['created_at', 'DESC']] });
  if (!otpRecord || isExpired(otpRecord.expires_at)) throw new AppError('Invalid or expired OTP', 400, 'INVALID_OTP');

  await otpRecord.update({ is_used: true });
  const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  await User.update({ password_hash }, { where: { email } });

  return { message: 'Password reset successful' };
};

module.exports = { register, verifyOtp, login, refreshToken: refreshTokenService, logout, forgotPassword, resetPassword };
