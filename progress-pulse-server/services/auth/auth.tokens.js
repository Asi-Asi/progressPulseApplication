import jwt from 'jsonwebtoken';





const SECRET = process.env.JWT_SECRET || 'devsecret';   // אותו סוד לכל המקומות
const EXPIRES = process.env.JWT_EXPIRES || '15m';


export function signAccessToken(user) {
  const payload = { sub: String(user._id), rlv: user.roleLevel || 10 };
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES });
}