import jwt from 'jsonwebtoken';
import User  from "./users.model.js";
import bcrypt from 'bcrypt';
import { Roles } from '../auth/roles.js';
import { signAccessToken } from '../auth/auth.tokens.js';
import { getByEmail as dbGetByEmail, createUser as dbCreateUser } from './users.db.js'; 
//t
import { signRefreshToken } from '../auth/auth.tokens.js';
import { storeRefreshToken } from '../auth/refreshTokens.db.js';






export async function getAllUsers(req, res) {
    try {
        const users = await User.getAllUsers();
        res.status(200).json({ users });
    } catch (error) {
        console.error('Error in getAllUsers:', error);
        res.status(500).json({ message: 'Internal server error' });
    }

}




//register
// register (fixed)
export async function register(req, res) {
  try {
    let { name = '', email, password } = req.body ?? {};
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    email = String(email).trim().toLowerCase();
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailOk) return res.status(400).json({ message: 'Invalid email format' });
    if (String(password).length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // best‑effort duplicate check (DB is still the source of truth)
    const exists = await dbGetByEmail(email);
    if (exists) return res.status(409).json({ message: 'Email already registered' });

    const passwordHash = bcrypt.hashSync(password, 10);
    const saved = await dbCreateUser({ name, email, password: passwordHash });

    // createUser returns the saved document with _id (not insertedId)
    const id = saved?._id?.toString?.();

    return res.status(201).json({
      message: 'Registration successful',
      role: 'user',
      token: undefined,
      user: { id, name, email }
    });
  } catch (err) {
    console.error('register error:', err);
    // map duplicate key to 409 instead of 500
    if (err?.status === 409 || err?.code === 11000) {
      return res.status(409).json({ message: 'Email already in use' });
    }
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body ?? {};
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // ===== Admin via .env =====
    const adminEmail = process.env.ADMIN_EMAIL || process.env.EXPO_PUBLIC_ADMIN_EMAIL;
    const adminPass  = process.env.ADMIN_PASSWORD || process.env.EXPO_PUBLIC_ADMIN_PASSWORD;

    if (adminEmail && adminPass && email === adminEmail && password === adminPass) {
      // Build payload aligned with the rest of the system (sub + rlv)
      const adminUserMini = { _id: 'admin', roleLevel: Roles.ADMIN }; // logical identifier
      const accessToken   = signAccessToken(adminUserMini);            // Access token
      const refreshToken  = signRefreshToken(adminUserMini);           // Refresh token

      // Persist the refresh token in DB (with its expiration)
      const parsed    = jwt.decode(refreshToken);
      const expiresAt = parsed?.exp ? new Date(parsed.exp * 1000) : null;
      await storeRefreshToken({
        userId: adminUserMini._id,
        token: refreshToken,
        deviceId: req.headers['x-device-id'] || null, // optional device identifier
        expiresAt,
      });

      return res.status(200).json({
        message: 'Login successful',
        accessToken,
        refreshToken,
        user: { id: 'admin', email: adminEmail, roleLevel: Roles.ADMIN, name: 'Administrator' }
      });
    }

    // ===== Normal user =====
    const normEmail = String(email).trim().toLowerCase();
    const user = await User.findByEmail(normEmail);
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });

    const ok = await bcrypt.compare(password, user.password); // your field is 'password' (hashed)
    if (!ok) return res.status(401).json({ message: 'Invalid email or password' });

    // Issue both tokens
    const accessToken  = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    // Persist the refresh token in DB (with its expiration)
    const parsed    = jwt.decode(refreshToken);
    const expiresAt = parsed?.exp ? new Date(parsed.exp * 1000) : null;
    await storeRefreshToken({
      userId: user._id,
      token: refreshToken,
      deviceId: req.headers['x-device-id'] || null, // optional device identifier
      expiresAt,
    });

    return res.status(200).json({
      message: 'Login successful',
      accessToken,
      refreshToken,
      user: { id: user._id, email: user.email, roleLevel: user.roleLevel }
    });

  } catch (error) {
    console.error('login error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}



//admin delete user by id
export async function deleteUserById(req, res) {
  try {

    const { id } = req.params; 
    
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid id' });
    }

    const result = await User.deleteById(id);
    if (result.deletedCount === 0) return res.status(404).json({ message: 'User not found' });
    return res.status(200).json({ message: 'User deleted' });


  } catch (err) {
    console.error('Error deleting user:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}   


//admin update user by id
export async function updateUserById(req, res) {
  try {
    const { id } = req.params;

    let data = req.body ?? {};

    // לבטיחות: נאפשר עדכון רק של שדות מותרים
    const allowed = ['firstName', 'lastName', 'gender', 'email', 'password', 'roleLevel'];
    const patch = {};
    for (const k of allowed) {
      if (k in data && data[k] !== undefined && data[k] !== null) {
        patch[k] = data[k];
      }
    }

    if (patch.email) patch.email = String(patch.email).trim().toLowerCase();

    if (patch.password) {
      const raw = String(patch.password);
      const looksHashed = raw.startsWith('$2a$') || raw.startsWith('$2b$');
      patch.password = looksHashed ? raw : await bcrypt.hash(raw, 10);
    }

    // עדכון בפועל (דרך המודל)
    const result = await User.updateById(id, patch);

    if (result?.matchedCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({ message: 'User updated' });
  } catch (err) {
    console.error('updateUserById error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}




//get my profile
export async function getMe(req, res) {
  try {
    const id = req.user?.sub;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { password, ...safe } = user; // אל תחזיר סיסמה
    return res.json(safe);
  } catch (err) {
    console.error('getMe error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

//update my profile
export async function updateMe(req, res) {
  try {
    const id = req.user?.sub;

    // רק שדות שמותר למשתמש לשנות לעצמו
    const allowed = ['firstName', 'lastName', 'gender', 'email'];
    const patch = {};
    for (const k of allowed) if (k in req.body && req.body[k] != null) patch[k] = req.body[k];

    // ולידציה בסיסית
    if ('gender' in patch) {
      const g = String(patch.gender).toLowerCase();
      if (!['male', 'female'].includes(g)) {
        return res.status(400).json({ message: 'Gender must be male or female' });
      }
      patch.gender = g;
    }

    if (patch.email) {
      patch.email = String(patch.email).trim().toLowerCase();
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(patch.email);
      if (!emailOk) return res.status(400).json({ message: 'Invalid email format' });
    }

    // אם משנים אימייל – בדיקת כפילות
    if (patch.email) {
      const exists = await User.findByEmail(patch.email);
      if (exists && String(exists._id) !== String(id)) {
        return res.status(409).json({ message: 'Email already in use' });
      }
    }

    const result = await User.updateById(id, patch);
    if (!result || result.matchedCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.json({ message: 'Profile updated' });
  } catch (err) {
    console.error('updateMe error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

//change my password
export async function changeMyPassword(req, res) {
  try {
    const id = req.user?.sub;
    const { currentPassword, newPassword } = req.body ?? {};
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'currentPassword and newPassword are required' });
    }
    if (String(newPassword).length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) return res.status(401).json({ message: 'Current password is incorrect' });

    const hash = await bcrypt.hash(newPassword, 10);
    await User.updateById(id, { password: hash });

    return res.json({ message: 'Password changed' });
  } catch (err) {
    console.error('changeMyPassword error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}