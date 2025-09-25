// services/auth/auth.tokens.js
import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'devsecret';
const ACCESS_EXPIRES  = process.env.JWT_EXPIRES || '15m';
const REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES || '30d';

// Ensure we never sign a token without a role level.
// Safer than defaulting to any role implicitly.
function getRoleLevelOrThrow(user) {
  const rlv = user?.roleLevel;
  if (rlv === undefined || rlv === null) {
    // Fail fast - prevents accidental ADMIN or wrong RLV in tokens.
    throw new Error('Cannot sign token: missing user.roleLevel');
  }
  return rlv;
}

export function signAccessToken(user) {
  const rlv = getRoleLevelOrThrow(user);                     // ← enforce presence
  const payload = {
    sub: String(user._id),                                   // user id
    rlv,                                                     // role level
    // email is optional; include only if you need it on the client
    ...(user.email ? { email: user.email } : {}),
  };
  return jwt.sign(payload, SECRET, { expiresIn: ACCESS_EXPIRES });
}

export function signRefreshToken(user) {
  const rlv = getRoleLevelOrThrow(user);                     // ← enforce presence
  const payload = {
    sub: String(user._id),
    rlv,
  };
  return jwt.sign(payload, SECRET, { expiresIn: REFRESH_EXPIRES });
}

export function verifyRefresh(token) {
  return jwt.verify(token, SECRET, { algorithms: ['HS256'] });
}
