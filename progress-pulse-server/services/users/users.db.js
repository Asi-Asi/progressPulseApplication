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
    try
    {
        client = await MongoClient.connect(process.env.CONNECTION_STRING);
        const db = client.db(process.env.DB_NAME);
        const result = await db.collection('Users').insertOne(user);
        return result;
    }
    catch (error) {
        console.error('Error creating user:', error);
        throw error;
    }
    
    finally {
        if (client) {
            client.close();
        }
    }
}

// Get a user by email --> Login
export async function getByEmail(email) {
  let client = null;
  try {
    client = await MongoClient.connect(process.env.CONNECTION_STRING);
    const db = client.db(process.env.DB_NAME);
    const user = await db.collection('Users').findOne({ email }); // חיפוש לפי מייל
    return user;
  } catch (error) {
    console.error('Error fetching user by email:', error);
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
    return await db.collection('Users').deleteOne({ _id: new ObjectId(id) }); // delete by _id
  } catch (error) {
    console.error('Error deleting user by id:', error);
    throw error;
  }finally {
    if (client) client.close();
  }
}
