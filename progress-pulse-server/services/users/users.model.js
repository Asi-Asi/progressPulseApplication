import bcrypt from 'bcrypt';
import { createUser, getAll, getByEmail, deleteById } from "./users.db.js";
import { formatInTimeZone } from 'date-fns-tz';                             



// helpers functions
function toYMD(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function normalizeBirthDate(bd) {
  if (!bd) return null;
  if (bd instanceof Date && !isNaN(bd)) return toYMD(bd);
  if (typeof bd === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(bd)) return bd;     
    const d = new Date(bd);
    if (!isNaN(d)) return toYMD(d);
  }
  return null;
}
function toLocal(d) {
  return formatInTimeZone(d, 'Asia/Jerusalem', 'yyyy-MM-dd HH:mm:ss');
}

export default class User{
    constructor({ firstName, lastName, name, birthDate, sex, phone, email, password, roleLevel }) {
    this.firstName = firstName?.trim() || '';
    this.lastName  = lastName?.trim()  || '';
    this.fullName  = (name?.trim() || `${this.firstName} ${this.lastName}`).trim();
    this.birthDate = normalizeBirthDate(birthDate);
    this.sex       = sex || '';
    this.phone     = phone?.trim() || '';
    this.email     = email?.trim().toLowerCase();
    this.password  = bcrypt.hashSync(password, 10); // 10 מספיק ומהיר
    this.roleLevel = roleLevel ?? 'USER';
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