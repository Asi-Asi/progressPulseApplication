import {MongoClient, ObjectId} from 'mongodb';


export async function getAll(){
    let client = null;
    try {
        client = await MongoClient.connect(process.env.CONNECTION_STRING);
        const db = client.db(process.env.DB_NAME);
        let users = await db.collection('Users').find().toArray();
        return users;
    }
    catch (error) {
        console.error('Error fetching users:', error);
        throw error;
    }
    
    finally {
        if (client) {
            client.close();
        }
    }
}


// Create a new user
export async function createUser(user) {
  let client = null;
  try {
    client = await MongoClient.connect(process.env.CONNECTION_STRING);
    const db = client.db(process.env.DB_NAME);
    const result = await db.collection('Users').insertOne(user);

    // החזר את המסמך שנשמר + ה-_id החדש
    return { ...user, _id: result.insertedId };
  } catch (error) {
    // אם יש אינדקס ייחודי על email, תתפוס 11000 ל-409 יפה
    if (error?.code === 11000) {
      error.status = 409;
      error.clientMessage = 'Email already in use';
    }
    console.error('Error creating user:', error);
    throw error;
  } finally {
    if (client) client.close();
  }
}

// Get a user by email --> Login
export async function getByEmail(email) {
  let client = null;
  try {
    client = await MongoClient.connect(process.env.CONNECTION_STRING);
    const db = client.db(process.env.DB_NAME);
    const user = await db.collection('Users').findOne({ email }); 
    return user;
  } catch (error) {
    console.error('Error fetching user by email:', error);
    throw error;
  } finally {
    if (client) client.close();
  }
}

export async function updateById(id, data) {
  let client = null;
  try {
    client = await MongoClient.connect(process.env.CONNECTION_STRING);
    const db = client.db(process.env.DB_NAME);
    return await db.collection('Users').updateOne(
      { _id: new ObjectId(id) },
      { $set: data }
    );
  } catch (error) {
    console.error('Error updating user by id:', error);
    throw error;
  } finally {
    if (client) client.close();
  }
}


export async function deleteById(id) {
  let client = null;
  try {
    client = await MongoClient.connect(process.env.CONNECTION_STRING);
    const db = client.db(process.env.DB_NAME);
    return await db.collection('Users').deleteOne({ _id: new ObjectId(id) }); 
  } catch (error) {
    console.error('Error deleting user by id:', error);
    throw error;
  }finally {
    if (client) client.close();
  }
}
