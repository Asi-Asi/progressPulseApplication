// scripts/promote-admin.js
// Usage:
// CONNECTION_STRING=... DB_NAME=... ADMIN_EMAIL=admin@test.com node scripts/promote-admin.js
import { MongoClient, ObjectId } from 'mongodb';

const CN_STR = process.env.CONNECTION_STRING;
const DB_NAME = process.env.DB_NAME;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_USER_ID = process.env.ADMIN_USER_ID; // alternative

if (!CN_STR || !DB_NAME || (!ADMIN_EMAIL && !ADMIN_USER_ID)) {
  console.error('Missing env: CONNECTION_STRING, DB_NAME and either ADMIN_EMAIL or ADMIN_USER_ID');
  process.exit(1);
}

(async () => {
  const client = await MongoClient.connect(CN_STR);
  try {
    const db = client.db(DB_NAME);
    const col = db.collection('Users');

    const filter = ADMIN_EMAIL
      ? { email: ADMIN_EMAIL }
      : { _id: new ObjectId(ADMIN_USER_ID) };

    const res = await col.updateOne(filter, { $set: { rlv: 10 } });
    if (!res.matchedCount) {
      console.error('No user matched the filter. Check email/id.');
      process.exit(1);
    }
    console.log('User promoted to admin (rlv=10).');
  } catch (e) {
    console.error('promote-admin error:', e);
    process.exit(1);
  } finally {
    await client.close();
  }
})();

