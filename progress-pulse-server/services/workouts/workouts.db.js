// workouts.db.js
import { MongoClient, ObjectId } from 'mongodb';

const CN_STR = process.env.CONNECTION_STRING;
const DB_NAME = process.env.DB_NAME;

const WORKOUTS = 'Workouts';
const PLANS = 'Plans';
const LOCAL_TZ = process.env.APP_TZ ; 



const oid = (x) => new ObjectId(x);

// YYYY-MM-DD ב-UTC
export const ymd = (d = new Date(), tz = LOCAL_TZ) => {
  // Returns YYYY-MM-DD in the given time zone (default Asia/Jerusalem)
    const fmt = new Intl.DateTimeFormat('en-GB', {
        timeZone: tz,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });
    const parts = fmt.formatToParts(d);
    const year  = parts.find(p => p.type === 'year').value;
    const month = parts.find(p => p.type === 'month').value;
    const day   = parts.find(p => p.type === 'day').value;
    return `${year}-${month}-${day}`;
};
// ---- Sessions ----
export async function getTodayOpenSession(userId) {
    let client = null;
    try {
        client = await MongoClient.connect(CN_STR);
        const db = client.db(DB_NAME);
        return await db.collection(WORKOUTS).findOne({
        userId: oid(userId),
        date: ymd(),
        status: 'open',
        });
    } finally {
        if (client) await client.close();
    }
}
// returning the planned exercises for the day
export async function snapshotPlanDay(userId, fromPlanId, planDay) {
    let client = null;
    try {
        client = await MongoClient.connect(CN_STR);
        const db = client.db(DB_NAME);

        const plan = await db.collection(PLANS).findOne({
        _id: oid(fromPlanId),
        userId: oid(userId),
        });
        if (!plan) return null;

        const day = (plan.days || []).find(
            (d) => d.day === planDay || d.dayNumber === planDay
        );
        if (!day) return null;

        return (day.exercises || []).map((e) => ({
        exerciseId: oid(e.exerciseId),
        sets: Number(e.sets) || 0,
        }));
    } finally {
        if (client) await client.close();
    }
}


//creating a new open session from a plan's day snapshot
export async function createOpenSession(userId, fromPlanId, planDay, planned) {
    let client = null;
    try {
        client = await MongoClient.connect(CN_STR);
        const db = client.db(DB_NAME);

        const doc = {
        userId: oid(userId),
        date: ymd(),
        status: 'open',
        fromPlanId: oid(fromPlanId),
        planDay,
        planned,
        exercises: [],
        };

        const res = await db.collection(WORKOUTS).insertOne(doc);
        return { ...doc, _id: res.insertedId };
    } finally {
        if (client) await client.close();
    }
}



// get session by id (for user, open or closed) 
export async function getSession(userId, sessionId) {
    let client = null;
    try {
        client = await MongoClient.connect(CN_STR);
        const db = client.db(DB_NAME);
        return await db.collection(WORKOUTS).findOne({
        _id: oid(sessionId),
        userId: oid(userId),
        });
    } finally {
        if (client) await client.close();
    }
}



// ---- Live tracking: add exercise / sets ----
export async function addExercise(userId, sessionId, exerciseId) {
    let client = null;
    try {
        client = await MongoClient.connect(CN_STR);
        const db = client.db(DB_NAME);
        const col = db.collection(WORKOUTS);

        // 1) fetch without status to detect "closed"
        const base = await col.findOne({ _id: oid(sessionId), userId: oid(userId) });
        if (!base) return null;                 // not found / not owned by user
        if (base.status === 'closed') return 'CLOSED';

        // 2) still open → add (idempotent thanks to $addToSet)
        const r = await col.findOneAndUpdate(
        { _id: base._id },
        { $addToSet: { exercises: { exerciseId: oid(exerciseId), sets: [] } } },
        { returnDocument: 'after' }
        );
        return r.value;
    } finally {
        if (client) await client.close();
    }
}


export async function removeExerciseDb(userId, sessionId, exerciseId) {
    let client = null;
    try {
        client = await MongoClient.connect(CN_STR);
        const db = client.db(DB_NAME);
        const col = db.collection(WORKOUTS);

        const base = await col.findOne({ _id: oid(sessionId), userId: oid(userId) });
        if (!base) return null;
        if (base.status === 'closed') return 'CLOSED';

        const filtered = (base.exercises || []).filter(e => String(e.exerciseId) !== String(exerciseId));
        await col.updateOne({ _id: base._id }, { $set: { exercises: filtered } });
        return await col.findOne({ _id: base._id });
    } finally {
        if (client) await client.close();
    }
}



export async function addSetDb(userId, sessionId, exerciseId, setData) {
    let client = null;
    try {
        client = await MongoClient.connect(CN_STR);
        const db = client.db(DB_NAME);
        const col = db.collection(WORKOUTS);

        const base = await col.findOne({ _id: oid(sessionId), userId: oid(userId) });
        if (!base) return null;              // לא שייך למשתמש/לא קיים
        if (base.status === 'closed') return 'CLOSED';

        // שלב 2: המשך כמו שהיה (לא צריך עוד פעם לשלוף עם status:'open')
        const doc = base;
        const exIdx = doc.exercises.findIndex(e => String(e.exerciseId) === String(exerciseId));
        if (exIdx === -1) return 'NO_EX';

        const next = (doc.exercises[exIdx].sets?.length || 0) + 1;
        const newSet = { setNumber: next, reps: setData.reps, weight: setData.weight };

        doc.exercises[exIdx].sets = [...(doc.exercises[exIdx].sets || []), newSet];
        await col.updateOne({ _id: doc._id }, { $set: { exercises: doc.exercises } });

        return await col.findOne({ _id: doc._id });
    } finally {
        if (client) await client.close();
    }
}

export async function updateSetDb(userId, sessionId, exerciseId, setNumber, setData) {
    let client = null;
    try {
        client = await MongoClient.connect(CN_STR);
        const db = client.db(DB_NAME);
        const col = db.collection(WORKOUTS);

        const base = await col.findOne({ _id: oid(sessionId), userId: oid(userId) });
        if (!base) return null;
        if (base.status === 'closed') return 'CLOSED';

        const doc = base;
        const exIdx = doc.exercises.findIndex(e => String(e.exerciseId) === String(exerciseId));
        if (exIdx === -1) return 'NO_EX';

        const sNum = Number(setNumber);                         // ← המרה למספר
        const sIdx = (doc.exercises[exIdx].sets || [])
        .findIndex((s) => Number(s.setNumber) === sNum);      // ← השוואת מספרים

        if (sIdx === -1) return 'NO_SET';

        // ודא שגם ה-payload הוא מספרים
        const reps   = Number(setData?.reps);
        const weight = Number(setData?.weight);

        doc.exercises[exIdx].sets[sIdx] = {
        ...doc.exercises[exIdx].sets[sIdx],
        reps,
        weight,
        };

        await col.updateOne({ _id: doc._id }, { $set: { exercises: doc.exercises } });
        return await col.findOne({ _id: doc._id });
    } finally {
        if (client) await client.close();
    }
}

export async function removeSetDb(userId, sessionId, exerciseId, setNumber) {
    let client = null;
    try {
        client = await MongoClient.connect(CN_STR);
        const db = client.db(DB_NAME);
        const col = db.collection(WORKOUTS);

        const base = await col.findOne({ _id: oid(sessionId), userId: oid(userId) });
        if (!base) return null;              // לא שייך למשתמש/לא קיים
        if (base.status === 'closed') return 'CLOSED';

        // שלב 2: המשך כמו שהיה (לא צריך עוד פעם לשלוף עם status:'open')
        const doc = base;
        const exIdx = doc.exercises.findIndex(e => String(e.exerciseId) === String(exerciseId));
        if (exIdx === -1) return 'NO_EX';

        const filtered = (doc.exercises[exIdx].sets || []).filter((s) => s.setNumber !== setNumber);
        doc.exercises[exIdx].sets = filtered.map((s, i) => ({ ...s, setNumber: i + 1 }));
        await col.updateOne({ _id: doc._id }, { $set: { exercises: doc.exercises } });

        return await col.findOne({ _id: doc._id });
    } finally {
        if (client) await client.close();
    }
}


export async function discardSessionDb(userId, sessionId) {
    let client = null;
    try {
        client = await MongoClient.connect(CN_STR);
        const db = client.db(DB_NAME);
        const col = db.collection(WORKOUTS);

        const r = await col.deleteOne({
        _id: oid(sessionId),
        userId: oid(userId),
        status: 'open',           // בטוח מוחקים רק סשן פתוח
        });

        return r.deletedCount > 0;
    } finally {
        if (client) await client.close();
    }
}

// ---- Close ----
export async function closeSessionDb(userId, sessionId) {
    let client = null;
    try {
        client = await MongoClient.connect(CN_STR);
        const db = client.db(DB_NAME);
        const col = db.collection(WORKOUTS);

        const r = await col.findOneAndUpdate(
        { _id: oid(sessionId), userId: oid(userId), status: 'open' },
        { $set: { status: 'closed' } },
        { returnDocument: 'after' }
        );
        return r.value; // null אם כבר סגור/לא נמצא
    } finally {
        if (client) await client.close();
    }
}

// ---- History / Analytics ----
export async function maxByExercise(userId, exerciseIds) {
    let client = null;
    try {
        client = await MongoClient.connect(CN_STR);
        const db = client.db(DB_NAME);

        if (!exerciseIds?.length) return {};
        const ids = exerciseIds.map(oid);

        const rows = await db
        .collection(WORKOUTS)
        .aggregate([
            { $match: { userId: oid(userId), status: 'closed' } },
            { $unwind: '$exercises' },
            { $match: { 'exercises.exerciseId': { $in: ids } } },
            { $unwind: '$exercises.sets' },
            { $group: { _id: '$exercises.exerciseId', maxWeight: { $max: '$exercises.sets.weight' } } },
        ])
        .toArray();

        const out = {};
        for (const r of rows) out[String(r._id)] = r.maxWeight ?? null;
        return out;
    } finally {
        if (client) await client.close();
    }
}

export async function listHistoryDb(userId, { from, to, skip = 0, limit = 20 }) {
    let client = null;
    try {
        client = await MongoClient.connect(CN_STR);
        const db = client.db(DB_NAME);
        const col = db.collection(WORKOUTS);

        const q = { userId: oid(userId), status: 'closed' };
        if (from || to) {
            q.date = {};
            if (from) q.date.$gte = from;
            if (to) q.date.$lte = to;
        }

        const items = await col
            .find(q)
            .sort({ date: -1, startedAt: -1 })
            .skip(Number(skip))
            .limit(Number(limit))
            .toArray();

        const total = await col.countDocuments(q);
        return { items, total };
    } finally {
        if (client) await client.close();
    }
}
