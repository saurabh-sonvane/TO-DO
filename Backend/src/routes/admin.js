const express = require('express');
const router = express.Router();

const {
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
} = require('../controllers/adminController');
const { authenticate, requireAdmin } = require('../middleware/auth');
const {
  updateUserStatusValidator,
  updateUserRoleValidator,
} = require('../middleware/validators');

// All admin routes require JWT + admin role
router.use(authenticate, requireAdmin);

// ─── Meta ─────────────────────────────────────────────────────────────────────
router.get('/dashboard', getDashboard);
router.get('/enums', getEnums);

// ─── User Management ──────────────────────────────────────────────────────────
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.delete('/users/:id', deleteUser);
router.patch('/users/:id/status', updateUserStatusValidator, updateUserStatus);
router.patch('/users/:id/role', updateUserRoleValidator, updateUserRole);

// ─── Task Management ──────────────────────────────────────────────────────────
router.get('/tasks', getAllTasks);
router.delete('/tasks/:id', adminDeleteTask);

// ─── Activity Logs ────────────────────────────────────────────────────────────
router.get('/logs', getActivityLogs);

module.exports = router;
