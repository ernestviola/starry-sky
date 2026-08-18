import passport from 'passport';
import { Strategy } from 'passport-jwt';
import { ExtractJwt } from 'passport-jwt';

var opts = {};

opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();

opts.secretOrKey = process.env.PASSPORT_JS_SECRET;

passport.use(
  'jwt',
  new Strategy(opts, function (jwt_payload, done) {
    if (!jwt_payload) {
      return done(null, false);
    }
    return done(null, jwt_payload);
  }),
);

export const authJWT = passport.authenticate('jwt', { session: false });
