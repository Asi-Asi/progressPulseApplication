import { createUser, getAll, getByEmail, deleteById, updateById, getById } from "./users.db.js";
import { Roles } from '../auth/roles.js';



function nowLocalISO(tz = 'Asia/Jerusalem') {
    const d = new Date();
    const local = new Date(d.toLocaleString('en-US', { timeZone: tz }));
    const pad = n => String(n).padStart(2, '0');
    const yyyy = local.getFullYear();
    const mm   = pad(local.getMonth()+1);
    const dd   = pad(local.getDate());
    const HH   = pad(local.getHours());
    const MM   = pad(local.getMinutes());
    const SS   = pad(local.getSeconds());
    // בלי אופסט; מציין את ה‑tz בשדה נפרד
    return `${yyyy}-${mm}-${dd} ==> T ${HH}:${MM}:${SS}`;
}

export default class User{
    constructor({ firstName, lastName, gender, email, password, roleLevel }) {
    this.firstName = firstName?.trim() || '';
    this.lastName  = lastName?.trim()  || '';
    this.gender    = gender || '';
    this.email     = email?.trim().toLowerCase();
    this.password  =  password; // 10 מספיק ומהיר
    this.roleLevel = roleLevel ?? Roles. TRAINEE;
    this.createdAt = nowLocalISO('Asia/Jerusalem');
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