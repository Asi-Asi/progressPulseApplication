import jwt from 'jsonwebtoken';
import User  from "./users.model.js";
import bcrypt from 'bcrypt';
import 'dotenv/config';
import { getByEmail as dbGetByEmail, createUser as dbCreateUser } from './users.db.js';



export async function getAllUsers(req, res) {
    try {
        const users = await User.getAllUsers();
        res.status(200).json({ users });
    } catch (error) {
        console.error('Error in getAllUsers:', error);
        res.status(500).json({ message: 'Internal server error' });
    }

}

export async function addUser(req, res) {
    try {
        const { email } = req.body;

        // בדיקה אם כבר קיים משתמש עם אותו מייל
        const existing = await User.findByEmail(email);
        if (existing) {
            return res.status(409).json({ message: 'Email already in use' });
        }

        const user = new User(req.body);
        const result = await user.save();
        res.status(201).json({ user: result });
    } catch (error) {
        console.error('Error in addUser:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}



export async function register(req, res) {
  try {
    let { name = '', email, password } = req.body ?? {};
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });

    email = String(email).trim().toLowerCase();
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailOk) return res.status(400).json({ message: 'Invalid email format' });
    if (String(password).length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });

    // Duplicate check
    const exists = await dbGetByEmail(email);
    if (exists) return res.status(409).json({ message: 'Email already registered' });

    // Hash + create via DB helper
    const passwordHash = bcrypt.hashSync(password, 10);
    const saved = await dbCreateUser({ name, email, password: passwordHash });

    // saved is the insertOne result — return a clean shape
    const id = saved?.insertedId?.toString?.();
    return res.status(201).json({
      message: 'Registration successful',
      role: 'user',
      token: undefined, // add JWT here later if you want auto-login
      user: { id, name, email }
    });
  } catch (err) {
    console.error('register error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}






export async function login(req, res) {
  try {
    const { email, password } = req.body ?? {};
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Admin via .env  (supports your current EXPO_ names too)
    const adminEmail = process.env.ADMIN_EMAIL || process.env.EXPO_PUBLIC_ADMIN_EMAIL;
    const adminPass  = process.env.ADMIN_PASSWORD || process.env.EXPO_PUBLIC_ADMIN_PASSWORD;

    if (adminEmail && adminPass && email === adminEmail && password === adminPass) {
      const token = jwt.sign(
        { sub: 'admin', role: 'admin' },
        process.env.JWT_SECRET || 'devsecret',
        { expiresIn: '2h' }
      );
      return res.status(200).json({
        message: 'Login successful',
        role: 'admin',
        token,
        user: { email: adminEmail, name: 'Administrator' }
      });
    }

    // Normal user via DB (adjust to your model/db helper)
    // If your model exposes getByEmail:
    const user = await User.findByEmail(email);
    // If not, use:  import { getByEmail } from './users.db.js';  const user = await getByEmail(email);

    if (!user) return res.status(401).json({ message: 'Invalid email or password' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: 'Invalid email or password' });

    const token = jwt.sign(
      { sub: user._id?.toString?.(), role: 'user' },
      process.env.JWT_SECRET || 'devsecret',
      { expiresIn: '2h' }
    );

    return res.status(200).json({
      message: 'Login successful',
      role: 'user',
      token,
      user: { id: user._id, email: user.email, name: user.name }
    });
  } catch (error) {
    console.error('Error in login:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}


export async function updateUserById(req, res) {
    try {
      const { id } = req.params;
      const data = req.body;
  
      const result = await User.updateById(id, data);
      if (result.modifiedCount === 0) {
        return res.status(404).json({ message: 'User not found or no changes made' });
      }
  
      res.status(200).json({ message: 'User updated successfully' });
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
  



export async function deleteUserById(req, res) {
  try {
    const { id } = req.params;                          // /:id
    const result = await User.deleteById(id);
    if (result.deletedCount === 0) return res.status(404).json({ message: 'User not found' });
    return res.status(200).json({ message: 'User deleted' });
  } catch (err) {
    console.error('Error deleting user:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}   