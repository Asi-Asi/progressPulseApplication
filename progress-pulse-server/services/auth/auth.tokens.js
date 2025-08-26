import jwt from 'jsonwebtoken';

export function signAccessToken(user) {
  // payload מינימלי: מזהה ותפקיד (level)
  const payload = { sub: String(user._id), rlv: user.roleLevel || 10 }; // rlv = role level
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES || '15m', // זמן חיים של הטוקן
  });
}