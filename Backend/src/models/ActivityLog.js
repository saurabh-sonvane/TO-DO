const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        // Auth
        'LOGIN',
        'LOGOUT',
        'REGISTER',
        'OAUTH_LOGIN',
        'TOKEN_REFRESH',
        // Task
        'TASK_CREATE',
        'TASK_UPDATE',
        'TASK_DELETE',
        'TASK_VIEW',
        // Admin
        'ADMIN_VIEW_USERS',
        'ADMIN_DELETE_USER',
        'ADMIN_UPDATE_USER_STATUS',
        'ADMIN_UPDATE_USER_ROLE',
        'ADMIN_VIEW_ALL_TASKS',
        'ADMIN_DELETE_TASK',
      ],
    },
    resource: {
      type: String,
      enum: ['task', 'user', null],
      default: null,
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
    ip: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    status: {
      type: String,
      enum: ['success', 'failure'],
      default: 'success',
    },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
activityLogSchema.index({ user: 1, createdAt: -1 });
activityLogSchema.index({ action: 1, createdAt: -1 });
activityLogSchema.index({ createdAt: -1 });

// Auto-expire logs after 90 days
activityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
