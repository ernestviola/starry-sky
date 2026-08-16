import { Strategy } from 'passport-jwt';
import { ExtractJwt } from 'passport-jwt';

var opts = {};

opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();

opts.secretOrKey = process.env.PASSPORT_JS_SECRET;
