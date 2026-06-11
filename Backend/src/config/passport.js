const passport = require('passport');
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const { Strategy: GitHubStrategy } = require('passport-github2');
const User = require('../models/User');
const logger = require('./logger');

// ─── JWT Strategy ────────────────────────────────────────────────────────────
passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET,
    },
    async (payload, done) => {
      try {
        const user = await User.findById(payload.id).select('-password');
        if (!user) return done(null, false);
        if (user.status === 'inactive') return done(null, false, { message: 'Account inactive' });
        return done(null, user);
      } catch (err) {
        return done(err, false);
      }
    }
  )
);

// ─── Google OAuth Strategy ───────────────────────────────────────────────────
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_ID !== 'your_google_client_id') {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          let user = await User.findOne({ oauthId: profile.id, oauthProvider: 'google' });

          if (!user) {
            user = await User.findOne({ email: profile.emails[0].value });
            if (user) {
              user.oauthId = profile.id;
              user.oauthProvider = 'google';
              await user.save();
            } else {
              user = await User.create({
                name: profile.displayName,
                email: profile.emails[0].value,
                oauthId: profile.id,
                oauthProvider: 'google',
                avatar: profile.photos?.[0]?.value,
                isEmailVerified: true,
              });
            }
          }

          return done(null, user);
        } catch (err) {
          logger.error('Google OAuth error', { error: err.message });
          return done(err, false);
        }
      }
    )
  );
}

// ─── GitHub OAuth Strategy ───────────────────────────────────────────────────
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_ID !== 'your_github_client_id') {
  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: process.env.GITHUB_CALLBACK_URL,
        scope: ['user:email'],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email =
            profile.emails?.[0]?.value || `${profile.username}@github.noemail`;

          let user = await User.findOne({ oauthId: profile.id, oauthProvider: 'github' });

          if (!user) {
            user = await User.findOne({ email });
            if (user) {
              user.oauthId = profile.id;
              user.oauthProvider = 'github';
              await user.save();
            } else {
              user = await User.create({
                name: profile.displayName || profile.username,
                email,
                oauthId: profile.id,
                oauthProvider: 'github',
                avatar: profile.photos?.[0]?.value,
                isEmailVerified: true,
              });
            }
          }

          return done(null, user);
        } catch (err) {
          logger.error('GitHub OAuth error', { error: err.message });
          return done(err, false);
        }
      }
    )
  );
}

module.exports = passport;
