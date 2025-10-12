// services/coach/coach.read.db.js
import { MongoClient, ObjectId } from 'mongodb';

const PLANS = 'Plans';
const EXERCISES = 'Exercises';
const WORKOUTS = 'Workouts';

const oid = (x) => new ObjectId(String(x));

/**
 * Return trainee's current plan WITH exercise names attached in each day.items
 * Shape: { days: [ { items: [ { exerciseId, sets, name } ] } ] }  or null
 */
export async function getTraineePlanWithNames(traineeId) {
    let client;
    try {
        client = await MongoClient.connect(process.env.CONNECTION_STRING);
        const db = client.db(process.env.DB_NAME);

        // Adjust filter if you use a "current"/"locked" flag
        const plan = await db.collection(PLANS).findOne(
            { userId: oid(traineeId) },
            { projection: { days: 1 } }
        );
        if (!plan) return null;

        // Gather all exerciseIds from plan
        const ids = [];
        for (const day of plan.days ?? []) {
            const arr = day.items ?? day.exercises ?? [];
            for (const it of arr) if (it?.exerciseId) ids.push(String(it.exerciseId));
        }
        const uniq = [...new Set(ids)]
            .filter((id) => ObjectId.isValid(id))
            .map((id) => oid(id));

        // Lookup names once
        const nameById = {};
        if (uniq.length) {
            const docs = await db.collection(EXERCISES)
                .find({ _id: { $in: uniq } })
                .project({ name: 1 })
                .toArray();
            for (const d of docs) nameById[String(d._id)] = d.name;
        }

        // Attach names back to items (keeping original structure)
        const out = {
            ...plan,
            days: (plan.days ?? []).map((d) => {
                const items = (d.items ?? d.exercises ?? []).map((it) => ({
                    ...it,
                    name: it.name ?? nameById[String(it.exerciseId)] ?? null,
                }));    
                return { ...d, items };
            }),
        };

        return out;
        } finally {
        if (client) await client.close();
    }
}

/**
 * Return specific trainee workout WITH exercise names attached on each exercise.
 * Uses workout.exercises: [{ exerciseId, sets, ... }]
 */
export async function getTraineeWorkoutWithNames(traineeId, workoutId) {
    let client;
    try {
        client = await MongoClient.connect(process.env.CONNECTION_STRING);
        const db = client.db(process.env.DB_NAME);

        const w = await db.collection(WORKOUTS).findOne(
        { _id: oid(workoutId), userId: oid(traineeId) }
        );
        if (!w) return null;

        const ids = (w.exercises ?? [])
        .map((e) => String(e.exerciseId))
        .filter(Boolean);
        const uniq = [...new Set(ids)]
        .filter((id) => ObjectId.isValid(id))
        .map((id) => oid(id));

        const nameById = {};
        if (uniq.length) {
        const docs = await db.collection(EXERCISES)
            .find({ _id: { $in: uniq } })
            .project({ name: 1 })
            .toArray();
        for (const d of docs) nameById[String(d._id)] = d.name;
        }

        const exercises = (w.exercises ?? []).map((e) => ({
        ...e,
        name: e.name ?? nameById[String(e.exerciseId)] ?? null,
        }));

        return { ...w, exercises };
    } finally {
        if (client) await client.close();
    }
}
