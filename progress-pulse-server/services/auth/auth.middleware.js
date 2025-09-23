// src/auth/auth.middleware.js
// אימות JWT + הרשאות
import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'devsecret';   // אותו סוד בדיוק


export function requireAuth(req, res, next) {
  const auth = req.headers.authorization || '';
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (!m) {
    res.set('WWW-Authenticate', 'Bearer');
    return res.status(401).json({ message: 'Missing token' });
  }
  const token = m[1].trim();

  try {
    const decoded = jwt.verify(token, SECRET, { algorithms: ['HS256'] });

    // Map "sub" to _id + id so downstream code works
    req.user = {
      _id: decoded.sub || decoded._id || decoded.id,
      id:  decoded.sub || decoded._id || decoded.id,
      rlv: decoded.rlv,
      email: decoded.email,
      // keep the rest if needed:
      ...decoded,
    };

    if (!req.user._id) {
      res.set('WWW-Authenticate', 'Bearer error="Missing user id in token"');
      return res.status(401).json({ message: 'Invalid token' });
    }

    return next();
  } catch (e) {
    const msg = e.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token';
    res.set('WWW-Authenticate', `Bearer error="${msg}"`);
    return res.status(401).json({ message: msg });
  }
}

export function requireRole(minLevel) {
  return (req, res, next) => {
    const level = req.user?.rlv ?? 0;            // roleLevel מהטוקן
    if (level >= minLevel) return next();        // מספיק גבוה
    return res.status(403).json({ message: 'Forbidden' });
  };
}