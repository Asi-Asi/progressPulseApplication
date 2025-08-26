import User  from "./users.model.js";
import bcrypt from 'bcrypt';
import { Roles } from '../auth/roles.js';
import { signAccessToken } from '../auth/auth.tokens.js';






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
export async function addUser(req, res) {
    try {
        const { email } = req.body;

        const existing = await User.findByEmail(email);
        if (existing) {
            return res.status(409).json({ message: 'Email already in use' });
        }

        const user = new User({ ...req.body, email, roleLevel: Roles.USER });
        const created = await user.save();                  // { ...user, _id }


        // חתימת טוקן והחזרה
        const accessToken = signAccessToken(created);
        res.status(201).json({
        message: 'Registered',
        accessToken,
        user: { id: created._id, email: created.email, roleLevel: created.roleLevel, fullName: created.fullName }
        });


    } catch (error) {
        console.error('Error in addUser:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}       


export async function   login(req, res) {

    try {
        const {email, password} = req.body;
        const user = await User.findByEmail(email);
        if (!user) return res.status(401).json({ message: 'Invalid email or password' });



        const ok = await bcrypt.compare(password, user.password); // אצלך השדה נקרא password (מוצפן)
        if (!ok) return res.status(401).json({ message: 'Invalid email or password' });


        const accessToken = signAccessToken(user);
        return res.status(200).json({
        message: 'Login successful',
        accessToken,
        user: { id: user._id, email: user.email, roleLevel: user.roleLevel, fullName: user.fullName }
        });

    } catch (error) {
        console.error('Error in login:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}


export async function deleteUserById(req, res) {
  try {

    const { id } = req.params;                          
    const result = await User.deleteById(id);
    if (result.deletedCount === 0) return res.status(404).json({ message: 'User not found' });
    return res.status(200).json({ message: 'User deleted' });


  } catch (err) {
    console.error('Error deleting user:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}   