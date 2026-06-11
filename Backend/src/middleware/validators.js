const { body, param, validationResult } = require('express-validator');
const { sendError } = require('../utils/response');

// ─── Validate Results ─────────────────────────────────────────────────────────
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 'Validation failed', 422, errors.array());
  }
  next();
};

// ─── Auth Validators ──────────────────────────────────────────────────────────
const registerValidator = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and a number'),
  // FIX: block role escalation on register
  body('role').not().exists().withMessage('Role cannot be set on registration'),
  validate,
];

const loginValidator = [
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  validate,
];

// ─── Task Validators ──────────────────────────────────────────────────────────
const createTaskValidator = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }),
  body('description').optional().trim().isLength({ max: 2000 }),
  body('status').optional().isIn(['todo', 'in_progress', 'done']).withMessage('Invalid status'),
  body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid priority'),
  body('dueDate').optional().isISO8601().withMessage('Invalid date format'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  validate,
];

const updateTaskValidator = [
  param('id').isMongoId().withMessage('Invalid task ID'),
  body('title').optional().trim().notEmpty().isLength({ max: 200 }),
  body('description').optional().trim().isLength({ max: 2000 }),
  body('status').optional().isIn(['todo', 'in_progress', 'done']),
  body('priority').optional().isIn(['low', 'medium', 'high']),
  body('dueDate').optional().isISO8601(),
  validate,
];

// ─── Admin Validators ─────────────────────────────────────────────────────────
const updateUserStatusValidator = [
  param('id').isMongoId().withMessage('Invalid user ID'),
  body('status').isIn(['active', 'inactive']).withMessage('Status must be active or inactive'),
  validate,
];

const updateUserRoleValidator = [
  param('id').isMongoId().withMessage('Invalid user ID'),
  body('role').isIn(['user', 'admin']).withMessage('Role must be user or admin'),
  validate,
];

// ─── Profile Update Validator ─────────────────────────────────────────────────
const updateProfileValidator = [
  body('name').optional().trim().notEmpty().isLength({ max: 100 }),
  body('avatar').optional().isURL().withMessage('Avatar must be a valid URL'),
  // block privilege fields on self-update
  body('role').not().exists().withMessage('Cannot update role via this endpoint'),
  body('status').not().exists().withMessage('Cannot update status via this endpoint'),
  validate,
];

module.exports = {
  registerValidator,
  loginValidator,
  createTaskValidator,
  updateTaskValidator,
  updateUserStatusValidator,
  updateUserRoleValidator,
  updateProfileValidator,
};
