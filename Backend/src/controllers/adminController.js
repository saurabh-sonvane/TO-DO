const User = require('../models/User');
const Task = require('../models/Task');
const ActivityLog = require('../models/ActivityLog');
const { logActivity, getRequestMeta } = require('../utils/activityLogger');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response');

// ─── Dashboard Stats ──────────────────────────────────────────────────────────
const getDashboard = async (req, res, next) => {
  try {
    const [
      totalUsers,
      activeUsers,
      adminCount,
      totalTasks,
      tasksByStatus,
      tasksByPriority,
      recentLogins,
      newUsersLast7Days,
      newTasksLast7Days,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: 'active' }),
      User.countDocuments({ role: 'admin' }),
      Task.countDocuments(),
      Task.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Task.aggregate([{ $group: { _id: '$priority', count: { $sum: 1 } } }]),
      ActivityLog.find({ action: { $in: ['LOGIN', 'OAUTH_LOGIN'] } })
        .populate('user', 'name email avatar role')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      User.countDocuments({ createdAt: { $gte: new Date(Date.now() - 7 * 86400000) } }),
      Task.countDocuments({ createdAt: { $gte: new Date(Date.now() - 7 * 86400000) } }),
    ]);

    // User growth — last 30 days grouped by day
    const userGrowth = await User.aggregate([
      { $match: { createdAt: { $gte: new Date(Date.now() - 30 * 86400000) } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Task completion trend — last 30 days
    const taskTrend = await Task.aggregate([
      { $match: { createdAt: { $gte: new Date(Date.now() - 30 * 86400000) } } },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            status: '$status',
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.date': 1 } },
    ]);

    const taskStatusMap = tasksByStatus.reduce((acc, s) => {
      acc[s._id] = s.count;
      return acc;
    }, {});

    const taskPriorityMap = tasksByPriority.reduce((acc, p) => {
      acc[p._id] = p.count;
      return acc;
    }, {});

    sendSuccess(res, {
      data: {
        stats: {
          users: {
            total: totalUsers,
            active: activeUsers,
            inactive: totalUsers - activeUsers,
            admins: adminCount,
            regularUsers: totalUsers - adminCount,
            newLast7Days: newUsersLast7Days,
          },
          tasks: {
            total: totalTasks,
            todo: taskStatusMap['todo'] || 0,
            in_progress: taskStatusMap['in_progress'] || 0,
            done: taskStatusMap['done'] || 0,
            completed: taskStatusMap['done'] || 0,        // alias for frontend
            pending: (taskStatusMap['todo'] || 0) + (taskStatusMap['in_progress'] || 0),
            high: taskPriorityMap['high'] || 0,
            medium: taskPriorityMap['medium'] || 0,
            low: taskPriorityMap['low'] || 0,
            newLast7Days: newTasksLast7Days,
          },
        },
        charts: {
          userGrowth,
          taskTrend,
        },
        recentLogins,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── View All Users (paginated + filters) ────────────────────────────────────
const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, status, search, sortBy = 'createdAt', order = 'desc' } = req.query;

    const filter = {};
    if (role) filter.role = role;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const sortOrder = order === 'asc' ? 1 : -1;

    const [users, total] = await Promise.all([
      User.find(filter)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      User.countDocuments(filter),
    ]);

    await logActivity({
      user: req.user._id,
      action: 'ADMIN_VIEW_USERS',
      ...getRequestMeta(req),
    });

    sendPaginated(res, users, total, page, limit);
  } catch (err) {
    next(err);
  }
};

// ─── Get Single User ──────────────────────────────────────────────────────────
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).lean();
    if (!user) return sendError(res, 'User not found', 404);

    // Attach task summary
    const taskSummary = await Task.aggregate([
      { $match: { owner: user._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const taskMap = taskSummary.reduce((acc, t) => {
      acc[t._id] = t.count;
      return acc;
    }, {});

    // Recent activity
    const recentActivity = await ActivityLog.find({ user: user._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    sendSuccess(res, {
      data: {
        user,
        taskSummary: {
          total: Object.values(taskMap).reduce((a, b) => a + b, 0),
          todo: taskMap['todo'] || 0,
          in_progress: taskMap['in_progress'] || 0,
          done: taskMap['done'] || 0,
        },
        recentActivity,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── Delete User ──────────────────────────────────────────────────────────────
const deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return sendError(res, 'Cannot delete your own account', 400);
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return sendError(res, 'User not found', 404);

    await Task.deleteMany({ owner: req.params.id });

    await logActivity({
      user: req.user._id,
      action: 'ADMIN_DELETE_USER',
      resource: 'user',
      resourceId: user._id,
      metadata: { deletedEmail: user.email, deletedRole: user.role },
      ...getRequestMeta(req),
    });

    sendSuccess(res, {}, 'User and their tasks deleted');
  } catch (err) {
    next(err);
  }
};

// ─── Update User Status ───────────────────────────────────────────────────────
const updateUserStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (req.params.id === req.user._id.toString()) {
      return sendError(res, 'Cannot change your own status', 400);
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!user) return sendError(res, 'User not found', 404);

    await logActivity({
      user: req.user._id,
      action: 'ADMIN_UPDATE_USER_STATUS',
      resource: 'user',
      resourceId: user._id,
      metadata: { newStatus: status, targetEmail: user.email },
      ...getRequestMeta(req),
    });

    sendSuccess(res, { data: { user: user.toPublicJSON() } }, `User status set to ${status}`);
  } catch (err) {
    next(err);
  }
};

// ─── Update User Role ─────────────────────────────────────────────────────────
const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;

    if (req.params.id === req.user._id.toString()) {
      return sendError(res, 'Cannot change your own role', 400);
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    );

    if (!user) return sendError(res, 'User not found', 404);

    await logActivity({
      user: req.user._id,
      action: 'ADMIN_UPDATE_USER_ROLE',
      resource: 'user',
      resourceId: user._id,
      metadata: { newRole: role, targetEmail: user.email },
      ...getRequestMeta(req),
    });

    sendSuccess(res, { data: { user: user.toPublicJSON() } }, `User role set to ${role}`);
  } catch (err) {
    next(err);
  }
};

// ─── View All Tasks ───────────────────────────────────────────────────────────
const getAllTasks = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      priority,
      userId,
      search,
      sortBy = 'createdAt',
      order = 'desc',
    } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (userId) filter.owner = userId;
    if (search) filter.$text = { $search: search };

    const skip = (page - 1) * limit;
    const sortOrder = order === 'asc' ? 1 : -1;

    const [tasks, total] = await Promise.all([
      Task.find(filter)
        .populate('owner', 'name email role avatar status')
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Task.countDocuments(filter),
    ]);

    await logActivity({
      user: req.user._id,
      action: 'ADMIN_VIEW_ALL_TASKS',
      ...getRequestMeta(req),
    });

    sendPaginated(res, tasks, total, page, limit);
  } catch (err) {
    next(err);
  }
};

// ─── Admin Delete Any Task ────────────────────────────────────────────────────
const adminDeleteTask = async (req, res, next) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id).populate('owner', 'name email');
    if (!task) return sendError(res, 'Task not found', 404);

    await logActivity({
      user: req.user._id,
      action: 'ADMIN_DELETE_TASK',
      resource: 'task',
      resourceId: task._id,
      metadata: { title: task.title, originalOwner: task.owner?._id },
      ...getRequestMeta(req),
    });

    sendSuccess(res, {}, 'Task deleted');
  } catch (err) {
    next(err);
  }
};

// ─── Activity Logs ────────────────────────────────────────────────────────────
const getActivityLogs = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 50,
      userId,
      action,
      status,
      startDate,
      endDate,
    } = req.query;

    const filter = {};
    if (userId) filter.user = userId;
    if (action) filter.action = action;
    if (status) filter.status = status;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      ActivityLog.find(filter)
        .populate('user', 'name email role avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      ActivityLog.countDocuments(filter),
    ]);

    sendPaginated(res, logs, total, page, limit);
  } catch (err) {
    next(err);
  }
};

// ─── Enum helpers for frontend filter dropdowns ───────────────────────────────
const getEnums = (req, res) => {
  sendSuccess(res, {
    data: {
      logActions: [
        'LOGIN', 'LOGOUT', 'REGISTER', 'OAUTH_LOGIN', 'TOKEN_REFRESH',
        'TASK_CREATE', 'TASK_UPDATE', 'TASK_DELETE', 'TASK_VIEW',
        'ADMIN_VIEW_USERS', 'ADMIN_DELETE_USER', 'ADMIN_UPDATE_USER_STATUS',
        'ADMIN_VIEW_ALL_TASKS', 'ADMIN_DELETE_TASK',
      ],
      userRoles: ['user', 'admin'],
      userStatuses: ['active', 'inactive'],
      taskStatuses: ['todo', 'in_progress', 'done'],
      taskPriorities: ['low', 'medium', 'high'],
    },
  });
};

module.exports = {
  getDashboard,
  getAllUsers,
  getUserById,
  deleteUser,
  updateUserStatus,
  updateUserRole,
  getAllTasks,
  adminDeleteTask,
  getActivityLogs,
  getEnums,
};
