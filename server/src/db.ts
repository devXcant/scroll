import { MongoClient, type Db } from 'mongodb';

let client: MongoClient | null = null;
let db: Db | null = null;
let mongoFailed = false;

export async function connectMongo(): Promise<Db | null> {
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) {
    console.warn('[db] MONGODB_URI not set — using local JSON files');
    return null;
  }
  if (mongoFailed) return null;
  if (db) return db;

  try {
    client = new MongoClient(uri);
    await client.connect();
    db = client.db(process.env.MONGODB_DB ?? 'scroll');
    console.log('[db] Connected to MongoDB');
    return db;
  } catch (e) {
    mongoFailed = true;
    client = null;
    db = null;
    console.warn(
      '[db] MongoDB unavailable, using local JSON files:',
      e instanceof Error ? e.message : e
    );
    return null;
  }
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
