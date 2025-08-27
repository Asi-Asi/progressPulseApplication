// אימות JWT + הרשאות
import jwt from 'jsonwebtoken';

export function requireAuth(req, res, next) {
  const auth = req.headers.authorization || '';                    // Authorization: Bearer <token>
  const [, token] = auth.split(' ');
  if (!token) return res.status(401).json({ message: 'Missing token' });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);          // { sub, rlv, iat, exp }
    return next();
  } catch (e) {
    const msg = e.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token';
    return res.status(401).json({ message: msg });
  }
}

export function requireRole(minLevel) {
  return (req, res, next) => {
    const level = req.user?.rlv ?? 0;
    if (level >= minLevel) return next();                          
    return res.status(403).json({ message: 'Forbidden' });
  };
}