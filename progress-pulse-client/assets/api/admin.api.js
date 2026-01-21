// assets/api/admin.api.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "./client"; // you already have this

/* small fetch wrapper with auth */
async function request(path, { method = "GET", body } = {}) {
  const token = await AsyncStorage.getItem("accessToken"); // same key you use elsewhere
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  // Normalize error messages
  if (!res.ok) {
    let errMsg = "Request failed";
    try {
      const j = await res.json();
      errMsg = j?.message || errMsg;
    } catch {}
    const error = new Error(errMsg);
    error.status = res.status;
    throw error;
  }

  // Some routes return { users: [...] }, others { message: ... }
  try {
    return await res.json();
  } catch {
    return null;
  }
}

/* GET all users (admin) */
export async function listUsers() {
  // Server returns { users: [...] }
  const data = await request("/api/users");
  return data?.users ?? [];
}

/* PUT update user (admin) */
export async function adminUpdateUser(id, patch) {
  // Only allowed keys server-side: firstName, lastName, gender, email, password, roleLevel
  return await request(`/api/users/${id}`, { method: "PUT", body: patch });
}



export async function adminDeleteUser(id) {
  // server: DELETE /api/users/:id (admin only)
  return await request(`/api/users/${id}`, { method: "DELETE" });
}



export async function adminCreateUser({ firstName, lastName, email, password, gender, roleLevel }) {
  // שלב 1: יצירה דרך register (לא דורש שינוי שרת)
  const regResp = await request("/api/users/register", {
    method: "POST",
    body: { firstName, lastName, email, password, gender },
  });

  // ננסה לחלץ את המשתמש שחזר מהריספונס (מגנים על כל הצורות הנפוצות)
  const created =
    regResp?.user ||
    regResp?.createdUser ||
    regResp ||
    null;

  const createdId = String(
    created?._id ||
    created?.id ||
    regResp?.id ||
    regResp?.insertedId ||
    ""
  );

  // שלב 2 (אופציונלי): שינוי תפקיד אם התבקש, ורק אם יש לנו מזהה
  if (createdId && typeof roleLevel === "number" && roleLevel !== 20) {
    try {
      await adminUpdateUser(createdId, { roleLevel });
      created.roleLevel = roleLevel; // סנכרון אופטימי לאובייקט המוחזר
    } catch (e) {
      // אם שינוי התפקיד נכשל – עדיין נחזיר את המשתמש שנוצר
      console.warn("adminCreateUser: role update failed:", e?.message);
    }
  }

  return created;
}

