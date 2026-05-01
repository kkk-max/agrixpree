const crypto = require('crypto');

const generateOTP = () => String(Math.floor(100000 + Math.random() * 900000));

const isExpired = (expiresAt) => new Date() > new Date(expiresAt);

module.exports = { generateOTP, isExpired };
