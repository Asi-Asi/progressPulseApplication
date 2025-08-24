import User  from "./users.model.js";
import bcrypt from 'bcrypt';




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


export async function   login(req, res) {

    try {
        const {email, password} = req.body;
        const user = await User.findByEmail(email);
        if (!user) return res.status(401).json({ message: 'Invalid email or password' });


        const ok = await bcrypt.compare(password, user.password); //compare
        //const user = users.find(user => user.email === email  &&  bcrypt.compareSync(password, user.password));

        if (ok) return res.status(200).json({ message: 'Login successful' });
        return res.status(401).json({ message: 'Invalid email or password' });

    } catch (error) {
        console.error('Error in login:', error);
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