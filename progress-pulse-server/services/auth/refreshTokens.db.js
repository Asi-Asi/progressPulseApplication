// services/auth/refreshTokens.db.js
import { MongoClient } from 'mongodb';
import crypto from 'crypto';

const COLLECTION = 'refreshTokens'; // שם הקולקציה

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex'); // לא לשמור ברור
}

export async function storeRefreshToken({ userId, token, deviceId = null, expiresAt = null }) {
    let client = null;
    try {
        client = await MongoClient.connect(process.env.CONNECTION_STRING);
        const db = client.db(process.env.DB_NAME);
        const doc = {
            userId: String(userId),                // מזהה משתמש
            tokenHash: hashToken(token),           // האש בלבד
            deviceId,                              // מזהה מכשיר (אופציונלי)
            createdAt: new Date(),
            expiresAt: expiresAt ? new Date(expiresAt) : null,
            revokedAt: null,
        };
        await db.collection(COLLECTION).insertOne(doc);       // שמירה
    } finally {
        if (client) await client.close();
    }
}

export async function revokeRefreshToken(token) {
    let client = null;
    try {
        client = await MongoClient.connect(process.env.CONNECTION_STRING);
        const db = client.db(process.env.DB_NAME);
        await db.collection(COLLECTION).updateMany(
            { tokenHash: hashToken(token), revokedAt: null },
            { $set: { revokedAt: new Date() } }
    ); // ביטול
    } finally {
        if (client) await client.close();
    }
}



export async function isRefreshTokenActive(token) {
    let client = null;
    try {
        client = await MongoClient.connect(process.env.CONNECTION_STRING);
        const db = client.db(process.env.DB_NAME);
        const rec = await db.collection(COLLECTION).findOne({ tokenHash: hashToken(token) });
        if (!rec) return false;                              // לא קיים
        if (rec.revokedAt) return false;                     // בוטל
        if (rec.expiresAt && rec.expiresAt < new Date()) return false; // פג
        return true;                                         // תקף
    } catch (err) {
        console.error('isRefreshTokenActive error:', err);
        return false;
    } finally {
        if (client) await client.close();
    }
}
