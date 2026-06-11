const express = require('express');
const router = express.Router();

const {
  createTask,
  getMyTasks,
  getTask,
  updateTask,
  deleteTask,
} = require('../controllers/taskController');
const { authenticate, requireActive } = require('../middleware/auth');
const { createTaskValidator, updateTaskValidator } = require('../middleware/validators');

// All task routes require authentication + active account
router.use(authenticate, requireActive);

router.route('/')
  .get(getMyTasks)
  .post(createTaskValidator, createTask);

router.route('/:id')
  .get(getTask)
  .patch(updateTaskValidator, updateTask)
  .delete(deleteTask);

module.exports = router;
