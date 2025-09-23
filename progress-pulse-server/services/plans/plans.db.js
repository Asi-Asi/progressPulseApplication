// services/plans/plans.db.js
import { MongoClient, ObjectId } from 'mongodb';

const CN_STR = process.env.CONNECTION_STRING;
const DB_NAME = process.env.DB_NAME;
const COLLECTION = 'Plans';

/**
 * Find the single current plan for a user by userId.
 * Returns null if not found.
 */
export async function findPlanByUserId(userId) {
    let client = null;
    try {
        client = await MongoClient.connect(CN_STR);
        const db = client.db(DB_NAME);
        return await db.collection(COLLECTION).findOne({ userId: new ObjectId(userId) });
    } catch (error) {
        console.error('Error fetching plan by userId:', error);
        throw error;
    } finally {
        if (client) await client.close();
    }
}

/**
 * Upsert (overwrite) the user's plan by userId.
 * - $set updates fields and sets updatedAt
 * - $setOnInsert sets createdAt only on first insert
 * Returns the updated document.
 */
export async function upsertPlanForUser(userId, doc) {
    let client = null;
    try {
        client = await MongoClient.connect(CN_STR);
        const db = client.db(DB_NAME);
        const col = db.collection(COLLECTION);

        const oid = new ObjectId(userId);
        // Prepare the document to set (ensure userId and updatedAt)
        const toSet = { ...doc, userId: oid, updatedAt: new Date() };

        const result = await col.findOneAndUpdate(
        { userId: oid },
        { $set: toSet, $setOnInsert: { createdAt: new Date() } },
        { upsert: true, returnDocument: 'after' }
        );

        return result.value;
    } catch (error) {
        console.error('Error upserting plan for user:', error);
        throw error;
    } finally {
        if (client) await client.close();
    }
}
