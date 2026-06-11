const express = require('express');
const passport = require('passport');
const router = express.Router();

const {
  register,
  login,
  oauthCallback,
  refreshToken,
  logout,
  getMe,
  updateProfile,
} = require('../controllers/authController');
const { authenticate, requireActive } = require('../middleware/auth');
const { registerValidator, loginValidator, updateProfileValidator } = require('../middleware/validators');

// ─── Local Auth ───────────────────────────────────────────────────────────────
router.post('/register', registerValidator, register);
router.post('/login', loginValidator, login);
router.post('/refresh', refreshToken);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);
router.patch('/me', authenticate, requireActive, updateProfileValidator, updateProfile);

// ─── Google OAuth ─────────────────────────────────────────────────────────────
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/api/auth/oauth-failed' }),
  oauthCallback
);

// ─── GitHub OAuth ─────────────────────────────────────────────────────────────
router.get(
  '/github',
  passport.authenticate('github', { scope: ['user:email'], session: false })
);
router.get(
  '/github/callback',
  passport.authenticate('github', { session: false, failureRedirect: '/api/auth/oauth-failed' }),
  oauthCallback
);

router.get('/oauth-failed', (req, res) => {
  res.status(401).json({ success: false, message: 'OAuth authentication failed' });
});

module.exports = router;
