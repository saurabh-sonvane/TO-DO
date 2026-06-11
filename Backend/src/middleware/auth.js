const passport = require('passport');
const { sendError } = require('../utils/response');

/**
 * Authenticate JWT — attaches req.user on success
 */
const authenticate = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      const message = info?.message || 'Unauthorized';
      return sendError(res, message, 401);
    }
    req.user = user;
    next();
  })(req, res, next);
};

/**
 * Restrict to Admin role only
 */
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return sendError(res, 'Forbidden: Admin access required', 403);
  }
  next();
};

/**
 * Restrict to specific roles
 * Usage: requireRole('admin', 'moderator')
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return sendError(res, `Forbidden: Requires role ${roles.join(' or ')}`, 403);
    }
    next();
  };
};

/**
 * Ensure account is active
 */
const requireActive = (req, res, next) => {
  if (req.user?.status !== 'active') {
    return sendError(res, 'Account is inactive. Contact support.', 403);
  }
  next();
};

module.exports = { authenticate, requireAdmin, requireRole, requireActive };
