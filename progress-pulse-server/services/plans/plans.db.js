// services/plans/plans.db.js
import { MongoClient, ObjectId } from 'mongodb';

const CN_STR = process.env.CONNECTION_STRING;
const DB_NAME = process.env.DB_NAME;
const COLLECTION = 'Plans';
const EXERCISES = 'Exercises';          // ← הוסף את זה


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




export async function findPlanViewByUserId(userId) {
    let client = null;
    try {
        client = await MongoClient.connect(CN_STR);
        const db = client.db(DB_NAME);

        const plan = await db.collection(COLLECTION).findOne({ userId: new ObjectId(userId) });
        if (!plan) return null;

        const rawIds = (plan.days || [])
        .flatMap(d => (Array.isArray(d.items) ? d.items : (d.exercises || [])))
        .map(it => it?.exerciseId)
        .filter(Boolean)
        .map(x => (typeof x === 'object' && x?._bsontype === 'ObjectId' ? String(x) : String(x)));

        const validIds = Array.from(new Set(rawIds)).filter(id => ObjectId.isValid(id));

        const metaMap = {};
        if (validIds.length) {
        const rows = await db.collection(EXERCISES)
            .find({ _id: { $in: validIds.map(id => new ObjectId(id)) } })
            .project({ name: 1, muscle: 1 })
            .toArray();
        for (const r of rows) metaMap[String(r._id)] = { name: r.name, muscle: r.muscle };
        }

        const payload = {
        planId: String(plan._id),        // <<< להבא מעולה למסך Tracking
        locked: !!plan.locked,           // <<< שישתקף ל־UI
        days: (plan.days || []).map(d => {
            const list = Array.isArray(d.items) ? d.items : (d.exercises || []);
            return {
            dayNumber: Number(d.dayNumber ?? d.day ?? 0),
            items: list.map(it => {
                const idStr = (typeof it.exerciseId === 'object' && it.exerciseId?._bsontype === 'ObjectId')
                ? String(it.exerciseId)
                : String(it.exerciseId || '');
                return {
                exerciseId: idStr,
                sets: Number(it.sets) || 1,
                name: metaMap[idStr]?.name ?? null,
                muscle: metaMap[idStr]?.muscle ?? null,
                };
            }),
            };
        }),
        };

        return payload;
    } finally {
        if (client) await client.close();
    }
}   