// scripts/set-coach.js  (ESM)
import 'dotenv/config';                  // ← טוען .env אוטומטית
import { MongoClient } from 'mongodb';

const email = 'test701@example.com'; // mail to give coach role
const newRoleLevel = 30; // COACH

const uri = process.env.CONNECTION_STRING;
const dbName = process.env.DB_NAME;

// בדיקות מוקדמות כדי למנוע השגיאה שראית
if (!uri) {
  console.error('Missing env: CONNECTION_STRING');
  process.exit(1);
}
if (!uri.startsWith('mongodb')) {
  console.error('CONNECTION_STRING must start with mongodb:// or mongodb+srv://');
  console.error('Got:', uri);
  process.exit(1);
}
if (!dbName) {
  console.error('Missing env: DB_NAME');
  process.exit(1);
}

async function run() {
  const client = await MongoClient.connect(uri);
  try {
    const db = client.db(dbName);
    const res = await db.collection('Users').updateOne(
      { email: email.trim().toLowerCase() },
      { $set: { roleLevel: newRoleLevel } }
    );
    console.log('Matched:', res.matchedCount, 'Modified:', res.modifiedCount);
  } finally {
    await client.close();
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});


//run command
//node scripts/set-coach.js