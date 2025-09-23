import jwt from 'jsonwebtoken';

export function signAccessToken(user) {
  
  const payload = { sub: String(user._id), rlv: user.roleLevel || 10 };
  const secret = process.env.JWT_SECRET || 'devsecret';
  const exp = process.env.JWT_EXPIRES || '15m';
  return jwt.sign(payload, secret, { expiresIn: exp });
}