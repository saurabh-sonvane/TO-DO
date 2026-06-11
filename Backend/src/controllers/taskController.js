const Task = require('../models/Task');
const { logActivity, getRequestMeta } = require('../utils/activityLogger');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response');

// ─── Create Task ──────────────────────────────────────────────────────────────
const createTask = async (req, res, next) => {
  try {
    const { title, description, status, priority, dueDate, tags } = req.body;

    const task = await Task.create({
      title,
      description,
      status,
      priority,
      dueDate,
      tags,
      owner: req.user._id,
    });

    await logActivity({
      user: req.user._id,
      action: 'TASK_CREATE',
      resource: 'task',
      resourceId: task._id,
      metadata: { title: task.title },
      ...getRequestMeta(req),
    });

    sendSuccess(res, { data: { task } }, 'Task created', 201);
  } catch (err) {
    next(err);
  }
};

// ─── Get My Tasks ─────────────────────────────────────────────────────────────
const getMyTasks = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, priority, search, sortBy = 'createdAt', order = 'desc' } = req.query;

    const filter = { owner: req.user._id };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (search) filter.$text = { $search: search };

    const skip = (page - 1) * limit;
    const sortOrder = order === 'asc' ? 1 : -1;

    const [tasks, total] = await Promise.all([
      Task.find(filter)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Task.countDocuments(filter),
    ]);

    await logActivity({
      user: req.user._id,
      action: 'TASK_VIEW',
      ...getRequestMeta(req),
    });

    sendPaginated(res, tasks, total, page, limit);
  } catch (err) {
    next(err);
  }
};

// ─── Get Single Task ──────────────────────────────────────────────────────────
const getTask = async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, owner: req.user._id });
    if (!task) return sendError(res, 'Task not found', 404);
    sendSuccess(res, { data: { task } });
  } catch (err) {
    next(err);
  }
};

// ─── Update Task ──────────────────────────────────────────────────────────────
const updateTask = async (req, res, next) => {
  try {
    const { title, description, status, priority, dueDate, tags } = req.body;

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      { title, description, status, priority, dueDate, tags },
      { new: true, runValidators: true }
    );

    if (!task) return sendError(res, 'Task not found or not authorized', 404);

    await logActivity({
      user: req.user._id,
      action: 'TASK_UPDATE',
      resource: 'task',
      resourceId: task._id,
      metadata: { changes: req.body },
      ...getRequestMeta(req),
    });

    sendSuccess(res, { data: { task } }, 'Task updated');
  } catch (err) {
    next(err);
  }
};

// ─── Delete Task ──────────────────────────────────────────────────────────────
const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (!task) return sendError(res, 'Task not found or not authorized', 404);

    await logActivity({
      user: req.user._id,
      action: 'TASK_DELETE',
      resource: 'task',
      resourceId: task._id,
      metadata: { title: task.title },
      ...getRequestMeta(req),
    });

    sendSuccess(res, {}, 'Task deleted');
  } catch (err) {
    next(err);
  }
};

module.exports = { createTask, getMyTasks, getTask, updateTask, deleteTask };
