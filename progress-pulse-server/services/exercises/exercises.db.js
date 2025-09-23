import { MongoClient, ObjectId } from 'mongodb';

const CN_STR = process.env.CONNECTION_STRING;
const DB_NAME = process.env.DB_NAME;
const COLLECTION = 'Exercises';

// Read-only list with optional filters
export async function findExercises(filters, opts) {
  let client = null;
  try {
    client = await MongoClient.connect(CN_STR);
    const db = client.db(DB_NAME);
    const col = db.collection(COLLECTION);

    const q = {};
    if (filters.muscle) q.muscle = filters.muscle;
    if (filters.nameRegex) q.name = filters.nameRegex;
    if (filters.query && !filters.nameRegex) {
      // fallback if controller passed 'query' instead of nameRegex
      const esc = filters.query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      q.name = { $regex: esc, $options: 'i' };
    }

    return await col.find(q)
      .project({ name: 1, muscle: 1, type: 1, equipment: 1 }) // only 4 fields
      .skip(opts.skip)
      .limit(opts.limit)
      .toArray();
  } finally {
    if (client) await client.close();
  }
}

export async function findExerciseById(id) {
  let client = null;
  try {
    client = await MongoClient.connect(CN_STR);
    const db = client.db(DB_NAME);
    const col = db.collection(COLLECTION);
    return await col.findOne({ _id: new ObjectId(id) }, { projection: { name: 1, muscle: 1, type: 1, equipment: 1 } });
  } finally {
    if (client) await client.close();
  }
}
