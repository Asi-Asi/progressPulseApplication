import bcrypt from 'bcrypt';
import { createUser, getAll, getByEmail,updateById,deleteById  } from "./users.db.js";


export default class User{
    constructor({ firstName, lastName, name, birthDate, sex, phone, email, password }) {
        this.firstName = firstName?.trim() || '';
        this.lastName  = lastName?.trim()  || '';
        this.fullName      = (name?.trim() || `${this.firstName} ${this.lastName}`).trim(); // שם מלא
        this.birthDate = normalizeBirthDate(birthDate);
        this.sex       = sex || '';                              // 'male' | 'female'
        this.phone     = phone?.trim() || '';
        this.email     = email?.trim().toLowerCase();            // אימייל תמיד lowercase
        this.password  = bcrypt.hashSync(password, 15);          // האשינג בצד השרת
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

    async save(){
        try{
            return await createUser(this);
        } catch (error) {
            console.error('Error saving user:', error);
            throw error;
        }
    }
}