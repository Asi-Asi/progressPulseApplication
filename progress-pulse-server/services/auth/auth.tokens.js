import jwt from 'jsonwebtoken';

export function signAccessToken(user) {
  
  const payload = { sub: String(user._id), rlv: user.roleLevel || 10 };
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES || '15m', 
  });
}