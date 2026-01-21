// services/auth/auth.middleware.js
import jwt from 'jsonwebtoken';
import { Roles, isAdmin, isCoach, isTrainee } from './roles.js';

const SECRET = process.env.JWT_SECRET || 'devsecret';

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

    // Map token fields safely into req.user
    const userId = decoded.sub || decoded._id || decoded.id;
    if (!userId) {
      res.set('WWW-Authenticate', 'Bearer error="Missing user id in token"');
      return res.status(401).json({ message: 'Invalid token' });
    }

    // Build a minimal and safe req.user object
    req.user = {
      _id: String(userId),
      id: String(userId),
      rlv: decoded.rlv,           // role level from token
      email: decoded.email ?? undefined,
    };

    return next();
  } catch (e) {
    const msg = e.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token';
    res.set('WWW-Authenticate', `Bearer error="${msg}"`);
    return res.status(401).json({ message: msg });
  }
}

/**
 * DEPRECATED: Avoid min-level checks because our scale is not ordinal (ADMIN=10, COACH=30).
 * Leave here only if old code still imports it. Prefer the explicit guards below.
 */
export function requireRole(/* minLevel */) {
  return (req, res, next) => {
    return res.status(500).json({ message: 'requireRole(min) is deprecated. Use explicit guards.' });
  };
}

// Explicit guards (recommended):

// Admin only (exact match)
export function requireAdmin(req, res, next) {
  const rlv = req.user?.rlv;
  if (isAdmin(rlv)) return next();
  return res.status(403).json({ message: 'Forbidden' });
}

// Coach only (coach or admin both pass for coach endpoints if you want admin override)
export function requireCoach(req, res, next) {
  const rlv = req.user?.rlv;
  if (isCoach(rlv) || isAdmin(rlv)) return next();
  return res.status(403).json({ message: 'Forbidden' });
}

// Trainee only (exact match)
export function requireTrainee(req, res, next) {
  const rlv = req.user?.rlv;
  if (isTrainee(rlv)) return next();
  return res.status(403).json({ message: 'Forbidden' });
}

/**
 * Utility to allow any of a set of roles.
 * Example: requireAnyRole([Roles.ADMIN, Roles.COACH])
 */
export function requireAnyRole(allowedRoles = []) {
  return (req, res, next) => {
    const rlv = req.user?.rlv;
    if (allowedRoles.includes(rlv)) return next();
    return res.status(403).json({ message: 'Forbidden' });
  };
}

/**
 * Utility to require exact role.
 * Example: requireExactRole(Roles.TRAINEE)
 */
export function requireExactRole(expectedRole) {
  return (req, res, next) => {
    const rlv = req.user?.rlv;
    if (rlv === expectedRole) return next();
    return res.status(403).json({ message: 'Forbidden' });
  };
}
