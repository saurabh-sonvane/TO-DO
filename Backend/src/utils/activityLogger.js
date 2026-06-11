const ActivityLog = require('../models/ActivityLog');
const logger = require('../config/logger');

/**
 * Log user activity to DB (non-blocking, fire-and-forget)
 */
const logActivity = async ({
  user,
  action,
  resource = null,
  resourceId = null,
  metadata = null,
  ip = null,
  userAgent = null,
  status = 'success',
}) => {
  try {
    await ActivityLog.create({
      user,
      action,
      resource,
      resourceId,
      metadata,
      ip,
      userAgent,
      status,
    });
  } catch (err) {
    // Never crash the app because of logging failure
    logger.error('Activity log write failed', { error: err.message, action, user });
  }
};

/**
 * Extract request metadata helper
 */
const getRequestMeta = (req) => ({
  ip: req.ip || req.connection?.remoteAddress,
  userAgent: req.headers['user-agent'],
});

module.exports = { logActivity, getRequestMeta };
