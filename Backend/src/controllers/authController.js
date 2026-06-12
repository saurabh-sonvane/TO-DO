const User = require('../models/User');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/token');
const { logActivity, getRequestMeta } = require('../utils/activityLogger');
const { sendSuccess, sendError } = require('../utils/response');
const logger = require('../config/logger');

// ─── Register ─────────────────────────────────────────────────────────────────
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body; // role intentionally excluded

    const existing = await User.findOne({ email });
    if (existing) return sendError(res, 'Email already registered', 409);

    // Always create as 'user' — admin must be assigned via admin panel
    const user = await User.create({ name, email, password, role: 'user' });

    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    user.loginCount += 1;
    await user.save({ validateBeforeSave: false });

    await logActivity({
      user: user._id,
      action: 'REGISTER',
      metadata: { method: 'local' },
      ...getRequestMeta(req),
    });

    sendSuccess(
      res,
      { data: { user: user.toPublicJSON(), accessToken, refreshToken } },
      'Registration successful',
      201
    );
  } catch (err) {
    next(err);
  }
};

// ─── Login ────────────────────────────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');

    if (!user || !user.password) {
      // user exists but registered via OAuth — no local password
      return sendError(res, 'Invalid email or password', 401);
    }

    if (!(await user.comparePassword(password))) {
      return sendError(res, 'Invalid email or password', 401);
    }

    if (user.status === 'inactive') {
      return sendError(res, 'Account is inactive. Contact support.', 403);
    }

    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    user.loginCount += 1;
    await user.save({ validateBeforeSave: false });

    await logActivity({
      user: user._id,
      action: 'LOGIN',
      metadata: { method: 'local', role: user.role },
      ...getRequestMeta(req),
    });

    sendSuccess(
      res,
      { data: { user: user.toPublicJSON(), accessToken, refreshToken } },
      'Login successful'
    );
  } catch (err) {
    next(err);
  }
};

// ─── OAuth Callback (Google / GitHub) ────────────────────────────────────────
const oauthCallback = async (req, res) => {
  try {
    const user = req.user;
    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    user.loginCount += 1;
    await user.save({ validateBeforeSave: false });

    await logActivity({
      user: user._id,
      action: 'OAUTH_LOGIN',
      metadata: { provider: user.oauthProvider, role: user.role },
    });

    // Pass role so frontend can redirect correctly (admin → /admin, user → /dashboard)
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const params = new URLSearchParams({
      accessToken,
      refreshToken,
      role: user.role,
    });
    res.redirect(`${clientUrl}/oauth-success?${params.toString()}`);
  } catch (err) {
    logger.error('OAuth callback error', { error: err.message });
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    res.redirect(`${clientUrl}/oauth-error`);
  }
};

// ─── Refresh Token ────────────────────────────────────────────────────────────
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) return sendError(res, 'Refresh token required', 400);

    let payload;
    try {
      payload = verifyRefreshToken(token);
    } catch {
      return sendError(res, 'Invalid or expired refresh token', 401);
    }

    const user = await User.findById(payload.id).select('+refreshToken');

    if (!user || user.refreshToken !== token) {
      return sendError(res, 'Refresh token reuse detected or invalid', 401);
    }

    if (user.status === 'inactive') {
      return sendError(res, 'Account is inactive', 403);
    }

    const newAccessToken = generateAccessToken(user._id, user.role);
    const newRefreshToken = generateRefreshToken(user._id);

    // Rotate refresh token
    user.refreshToken = newRefreshToken;
    await user.save({ validateBeforeSave: false });

    await logActivity({ user: user._id, action: 'TOKEN_REFRESH', ...getRequestMeta(req) });

    sendSuccess(res, {
      data: { accessToken: newAccessToken, refreshToken: newRefreshToken },
    });
  } catch (err) {
    next(err);
  }
};

// ─── Logout ───────────────────────────────────────────────────────────────────
const logout = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
    await logActivity({ user: req.user._id, action: 'LOGOUT', ...getRequestMeta(req) });
    sendSuccess(res, {}, 'Logged out successfully');
  } catch (err) {
    next(err);
  }
};

// ─── Get Me ───────────────────────────────────────────────────────────────────
const getMe = (req, res) => {
  sendSuccess(res, { data: { user: req.user.toPublicJSON() } });
};

// ─── Update Own Profile ───────────────────────────────────────────────────────
const updateProfile = async (req, res, next) => {
  try {
    const { name, avatar } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { ...(name && { name }), ...(avatar && { avatar }) },
      { new: true, runValidators: true }
    );
    sendSuccess(res, { data: { user: user.toPublicJSON() } }, 'Profile updated');
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, oauthCallback, refreshToken, logout, getMe, updateProfile };
