require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Task = require('../models/Task');
const ActivityLog = require('../models/ActivityLog');
const logger = require('../config/logger');

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  logger.info('Connected to MongoDB for seeding...');

  await User.deleteMany({});
  await Task.deleteMany({});
  await ActivityLog.deleteMany({});

  // ─── Admin ────────────────────────────────────────────────────────────────
  const admin = await User.create({
    name: 'Super Admin',
    email: 'admin@taskapi.dev',
    password: 'Admin@1234',
    role: 'admin',
    status: 'active',
    isEmailVerified: true,
    lastLogin: new Date(),
    loginCount: 12,
  });

  // ─── Regular Users ────────────────────────────────────────────────────────
  const users = await User.create([
    {
      name: 'Alice Johnson',
      email: 'alice@taskapi.dev',
      password: 'Alice@1234',
      role: 'user',
      status: 'active',
      isEmailVerified: true,
      lastLogin: new Date(Date.now() - 3600000),
      loginCount: 5,
    },
    {
      name: 'Bob Smith',
      email: 'bob@taskapi.dev',
      password: 'Bob@12345',
      role: 'user',
      status: 'active',
      isEmailVerified: true,
      lastLogin: new Date(Date.now() - 86400000),
      loginCount: 3,
    },
    {
      name: 'Carol White',
      email: 'carol@taskapi.dev',
      password: 'Carol@1234',
      role: 'user',
      status: 'inactive',
      isEmailVerified: false,
      loginCount: 1,
    },
  ]);

  // ─── Tasks ────────────────────────────────────────────────────────────────
  await Task.create([
    { title: 'Setup CI/CD pipeline',       status: 'done',        priority: 'high',   owner: users[0]._id, tags: ['devops'] },
    { title: 'Write unit tests',           status: 'in_progress', priority: 'high',   owner: users[0]._id, tags: ['testing'] },
    { title: 'API documentation',          status: 'todo',        priority: 'medium', owner: users[0]._id },
    { title: 'Design database schema',     status: 'done',        priority: 'high',   owner: users[1]._id, tags: ['backend'] },
    { title: 'Implement auth flow',        status: 'in_progress', priority: 'high',   owner: users[1]._id },
    { title: 'Build admin dashboard',      status: 'todo',        priority: 'medium', owner: users[1]._id, tags: ['frontend'] },
    { title: 'User onboarding flow',       status: 'todo',        priority: 'low',    owner: users[2]._id },
    { title: 'Performance audit',          status: 'done',        priority: 'medium', owner: admin._id,    tags: ['ops'] },
  ]);

  // ─── Sample Activity Logs ─────────────────────────────────────────────────
  const now = Date.now();
  await ActivityLog.insertMany([
    { user: admin._id,    action: 'LOGIN',       metadata: { method: 'local', role: 'admin' }, ip: '127.0.0.1', createdAt: new Date(now - 1000) },
    { user: users[0]._id, action: 'LOGIN',       metadata: { method: 'local', role: 'user' },  ip: '127.0.0.1', createdAt: new Date(now - 3600000) },
    { user: users[0]._id, action: 'TASK_CREATE', resource: 'task', metadata: { title: 'Setup CI/CD pipeline' }, createdAt: new Date(now - 7200000) },
    { user: users[1]._id, action: 'REGISTER',    metadata: { method: 'local' }, createdAt: new Date(now - 86400000) },
    { user: users[1]._id, action: 'LOGIN',       metadata: { method: 'local', role: 'user' }, createdAt: new Date(now - 86400000 + 1000) },
    { user: users[1]._id, action: 'TASK_UPDATE', resource: 'task', metadata: { changes: { status: 'done' } }, createdAt: new Date(now - 43200000) },
    { user: admin._id,    action: 'ADMIN_VIEW_USERS', createdAt: new Date(now - 500) },
  ]);

  console.log('\n✅  Seed complete\n');
  console.log('┌─────────────────────────────────────────────┐');
  console.log('│  CREDENTIALS                                │');
  console.log('├─────────────────────────────────────────────┤');
  console.log('│  Admin   admin@taskapi.dev  Admin@1234      │');
  console.log('│  User 1  alice@taskapi.dev  Alice@1234      │');
  console.log('│  User 2  bob@taskapi.dev    Bob@12345       │');
  console.log('│  User 3  carol@taskapi.dev  Carol@1234      │');
  console.log('└─────────────────────────────────────────────┘\n');

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
