const jwt = require('jsonwebtoken');
const { AppError } = require('./errorHandler');

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  // Allow token via query param for SSE (EventSource cannot set headers)
  const raw = (authHeader && authHeader.startsWith('Bearer '))
    ? authHeader.split(' ')[1]
    : req.query.token;
  if (!raw) return next(new AppError('Access token required', 401, 'UNAUTHORIZED'));
  try {
    req.user = jwt.verify(raw, process.env.JWT_SECRET);
    next();
  } catch (err) {
    return next(new AppError('Invalid or expired token', 401, 'UNAUTHORIZED'));
  }
};

// Attaches req.user when a valid token is present, but never rejects the request.
// Used for endpoints that work for guests but enrich behaviour for logged-in users.
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      req.user = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
    } catch (err) {
      // Ignore invalid/expired token — proceed as guest.
    }
  }
  next();
};

module.exports = { authenticate, optionalAuth };
