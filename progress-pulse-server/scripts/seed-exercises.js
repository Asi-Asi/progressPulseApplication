// scripts/seed-exercises.js
// Usage: CONNECTION_STRING=... DB_NAME=... node scripts/seed-exercises.js

import { MongoClient } from 'mongodb';

const CN_STR = process.env.CONNECTION_STRING;
const DB_NAME = process.env.DB_NAME;
const COLLECTION = 'Exercises';

if (!CN_STR || !DB_NAME) {
  console.error('Missing env: CONNECTION_STRING and/or DB_NAME');
  process.exit(1);
}

// Minimal catalog: 4 exercises per muscle
const docs = [
  // Abs
  { name: 'Plank',                muscle: 'Abs',       type: 'Isolation', equipment: 'Bodyweight' },
  { name: 'Crunch',               muscle: 'Abs',       type: 'Isolation', equipment: 'Bodyweight' },
  { name: 'Hanging Leg Raise',    muscle: 'Abs',       type: 'Isolation', equipment: 'Bodyweight' },
  { name: 'Cable Crunch',         muscle: 'Abs',       type: 'Isolation', equipment: 'Cable' },

  // Back
  { name: 'Lat Pulldown',         muscle: 'Back',      type: 'Compound',  equipment: 'Machine' },
  { name: 'Pull-Up',              muscle: 'Back',      type: 'Compound',  equipment: 'Bodyweight' },
  { name: 'Bent-Over Row',        muscle: 'Back',      type: 'Compound',  equipment: 'Barbell' },
  { name: 'Seated Cable Row',     muscle: 'Back',      type: 'Compound',  equipment: 'Cable' },

  // Biceps
  { name: 'Barbell Curl',         muscle: 'Biceps',    type: 'Isolation', equipment: 'Barbell' },
  { name: 'Hammer Curl',          muscle: 'Biceps',    type: 'Isolation', equipment: 'Dumbbells' },
  { name: 'Preacher Curl',        muscle: 'Biceps',    type: 'Isolation', equipment: 'Machine' },
  { name: 'Cable Curl',           muscle: 'Biceps',    type: 'Isolation', equipment: 'Cable' },

  // Chest
  { name: 'Barbell Bench Press',  muscle: 'Chest',     type: 'Compound',  equipment: 'Barbell' },
  { name: 'Incline DB Press',     muscle: 'Chest',     type: 'Compound',  equipment: 'Dumbbells' },
  { name: 'Chest Fly Machine',    muscle: 'Chest',     type: 'Isolation', equipment: 'Machine' },
  { name: 'Push-Up',              muscle: 'Chest',     type: 'Compound',  equipment: 'Bodyweight' },

  // Forearms
  { name: 'Wrist Curl',           muscle: 'Forearms',  type: 'Isolation', equipment: 'Barbell' },
  { name: 'Reverse Wrist Curl',   muscle: 'Forearms',  type: 'Isolation', equipment: 'Dumbbells' },
  { name: 'Farmer\'s Walk',       muscle: 'Forearms',  type: 'Compound',  equipment: 'Dumbbells' },
  { name: 'Cable Wrist Curl',     muscle: 'Forearms',  type: 'Isolation', equipment: 'Cable' },

  // Legs
  { name: 'Back Squat',           muscle: 'Legs',      type: 'Compound',  equipment: 'Barbell' },
  { name: 'Leg Press',            muscle: 'Legs',      type: 'Compound',  equipment: 'Machine' },
  { name: 'Romanian Deadlift',    muscle: 'Legs',      type: 'Compound',  equipment: 'Barbell' },
  { name: 'Leg Extension',        muscle: 'Legs',      type: 'Isolation', equipment: 'Machine' },

  // Shoulders
  { name: 'Overhead Press',       muscle: 'Shoulders', type: 'Compound',  equipment: 'Barbell' },
  { name: 'Lateral Raise',        muscle: 'Shoulders', type: 'Isolation', equipment: 'Dumbbells' },
  { name: 'Face Pull',            muscle: 'Shoulders', type: 'Isolation', equipment: 'Cable' },
  { name: 'Arnold Press',         muscle: 'Shoulders', type: 'Compound',  equipment: 'Dumbbells' },

  // Triceps
  { name: 'Triceps Pushdown',     muscle: 'Triceps',   type: 'Isolation', equipment: 'Cable' },
  { name: 'Close-Grip Bench',     muscle: 'Triceps',   type: 'Compound',  equipment: 'Barbell' },
  { name: 'Overhead Triceps Ext', muscle: 'Triceps',   type: 'Isolation', equipment: 'Dumbbells' },
  { name: 'Dips',                 muscle: 'Triceps',   type: 'Compound',  equipment: 'Parallel Bars' },
];

(async () => {
  const client = await MongoClient.connect(CN_STR);
  try {
    const db = client.db(DB_NAME);
    const col = db.collection(COLLECTION);

    // Idempotent upsert by (name + muscle)
    const ops = docs.map(doc => ({
      updateOne: {
        filter: { name: doc.name, muscle: doc.muscle },
        update: { $set: doc },
        upsert: true,
      },
    }));

    const res = await col.bulkWrite(ops, { ordered: false });
    const upserts = res.upsertedCount || 0;
    const mods    = (res.modifiedCount || 0);
    console.log(`[seed] Exercises upserted: ${upserts}, modified: ${mods}`);
  } catch (e) {
    console.error('[seed] error:', e);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
})();
