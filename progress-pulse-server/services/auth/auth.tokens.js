// services/auth/auth.tokens.js
import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'devsecret';            // אותו סוד
const ACCESS_EXPIRES  = process.env.JWT_EXPIRES || '15m';        // תוקף גישה
const REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES || '30d';// תוקף ריענון

export function signAccessToken(user) {
  const payload = { sub: String(user._id), rlv: user.roleLevel ?? 10 }; // מזהה ותפקיד
  return jwt.sign(payload, SECRET, { expiresIn: ACCESS_EXPIRES });      // Access
}

export function signRefreshToken(user) {
  const payload = { sub: String(user._id), rlv: user.roleLevel ?? 10 }; // אותו payload
  return jwt.sign(payload, SECRET, { expiresIn: REFRESH_EXPIRES });     // Refresh ארוך
}

export function verifyRefresh(token) {
  return jwt.verify(token, SECRET, { algorithms: ['HS256'] });          // אימות Refresh
}
