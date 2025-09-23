// אימות JWT + הרשאות
import jwt from 'jsonwebtoken';

export function requireAuth(req, res, next) {
  const auth = req.headers.authorization || '';
  //let's see if the auth header is in the correct format
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (!m) {
    // If the format is incorrect, return a 401 Unauthorized response
    res.set('WWW-Authenticate', 'Bearer');
    return res.status(401).json({ message: 'Missing token' });
  }
  //m[1] contains the token part after "Bearer
  const token = m[1].trim();

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] }); 
    req.token = token; 
    return next();
  } catch (e) {
    const msg = e.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token';
    res.set('WWW-Authenticate', `Bearer error="${msg}"`);
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