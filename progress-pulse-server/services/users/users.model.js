import bcrypt from 'bcrypt';
import { createUser, getAll, getByEmail, deleteById, updateById, getById } from "./users.db.js";
import { Roles } from '../auth/roles.js';





export default class User{
    constructor({ firstName, lastName, gender, email, password, roleLevel }) {
    this.firstName = firstName?.trim() || '';
    this.lastName  = lastName?.trim()  || '';
    this.gender    = gender || '';
    this.email     = email?.trim().toLowerCase();
    this.password  = bcrypt.hashSync(password, 10); // 10 מספיק ומהיר
    this.roleLevel = roleLevel ?? Roles.USER;
    this.createdAt = toLocal(new Date());
    }

    static async getAllUsers() {
        try {
            return await getAll();
        } catch (error) {
            console.error('Error fetching all users:', error);
            throw error;
        }
    }

    static async findByEmail(email) {
    try { return await getByEmail(email); }
    catch (error) { console.error('Error fetching user by email:', error); throw error; }
    }

    static async updateById(id, data) {
        return await updateById(id, data);
    }

    static async deleteById(id) {
      return await deleteById(id);
    }

    static async findById(id) {
        try {
            const user = await getById(id);
            return user;
        } catch (error) {
            console.error('Error fetching user by id:', error);
            throw error;
        }
    }

    async save(){
        try{
            return await createUser(this);
        } catch (error) {
            console.error('Error saving user:', error);
            throw error;
        }
    }
}