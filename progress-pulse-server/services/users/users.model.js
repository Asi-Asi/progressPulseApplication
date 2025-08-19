import bcrypt from 'bcrypt';
import { createUser, getAll, getByEmail  } from "./users.db.js";


export default class User{
    constructor({name, email, password }){
        this.name = name;
        this.email = email;
        this.password = bcrypt.hashSync(password, 15); // Hashing the password
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