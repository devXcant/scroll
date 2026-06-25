import { MongoClient, type Db } from 'mongodb';

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectMongo(): Promise<Db | null> {
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) {
    console.warn('[db] MONGODB_URI not set — using local JSON files');
    return null;
  }

  if (db) return db;

  client = new MongoClient(uri);
  await client.connect();
  db = client.db(process.env.MONGODB_DB ?? 'scroll');
  console.log('[db] Connected to MongoDB');
  return db;
}

export async function getDb(): Promise<Db | null> {
  if (db) return db;
  return connectMongo();
}

export async function closeMongo(): Promise<void> {
  await client?.close();
  client = null;
  db = null;
}
