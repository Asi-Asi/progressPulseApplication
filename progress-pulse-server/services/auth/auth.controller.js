import { uploadToCloud } from "../upload/upload.model.js";
import { validateUser, addNewUser } from "./auth.model.js";

export async function login(req, res) {
    let { username, password } = req.body;

    let user = await validateUser(username, password);

    if (user) {
        res.status(200).json({
            message: 'Login successful',
            user
        });
    } else {
        res.status(401).json({
            message: 'Login failed'
        });
    }
}

export async function register(req, res) {
    let { username, password } = req.body;

    let result = await uploadToCloud(req.file.path);

    let ans = await addNewUser(username, password, result.secure_url);

    if (!ans) {
        res.status(400).json({
            message: 'User already exists'
        });
    } else {
        res.status(201).json({
            message: 'User registered successfully'
        });
    }
}