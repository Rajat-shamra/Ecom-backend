// googleAuth.js
const jwt = require('jsonwebtoken');
const passport = require('passport');
const session = require("express-session");
const { Strategy: GoogleStrategy } = require("passport-google-oauth2");
const userDb = require("../model/user/userModel");
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_SECRET_KEY= process.env.GOOGLE_SECRET_KEY;
const SECRET_KEY = process.env.USER_SECRET_KEY;
const FRONTEND_DEV_URL = process.env.FRONTEND_DEV_URL;
const FRONTEND_PROD_URL = process.env.FRONTEND_PROD_URL;
const Node_Env = process.env.NODE_ENV;

const Redirect_Url = Node_Env === "development" ?  FRONTEND_DEV_URL : FRONTEND_PROD_URL;

function configureGoogleAuth(app) {
  app.use(session({
    secret: "asgfjsgfyriwyerxcbv,mn",
    resave: false,
    saveUninitialized: true,
  }));

  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_SECRET_KEY,
        callbackURL: "/auth/google/callback",
        scope: ["profile", "email"],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          let user = await userDb.findOne({ googleId: profile.id });
          if (!user) {
            user = new userDb({
              googleId: profile.id,
              displayName: profile.displayName,
              email: profile.emails[0].value,
              image: profile.photos[0].value,
            });
            await user.save();
          }

          const token = jwt.sign({ _id: user._id }, SECRET_KEY, {
            expiresIn: "1d",
          });

          user.tokens = user.tokens.concat({ token });
          await user.save();

          return done(null, { user, token });
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );

  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((user, done) => done(null, user));

  // Google Auth Routes
  app.get('/auth/google', passport.authenticate("google", { scope: ["profile", "email"] }));

  app.get(
    "/auth/google/callback",
    passport.authenticate("google", {
      failureRedirect: `${Redirect_Url}/login`,
    }),
    (req, res) => {
      const { user, token } = req.user;

      res.redirect(
        `${Redirect_Url}/google-auth-success?token=${token}&name=${encodeURIComponent(user.displayName)}&email=${encodeURIComponent(user.email)}&image=${encodeURIComponent(user.image)}`
      );
    }
  );
}

module.exports = configureGoogleAuth;
