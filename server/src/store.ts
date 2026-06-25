import type { Db } from 'mongodb';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDb } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const USERS_DIR = path.join(__dirname, '..', 'data', 'users');
const LOGS_DIR = path.join(__dirname, '..', 'data', 'logs');

export type UserPermissions = {
  shieldEnabled: boolean;
  usageStats: boolean;
  overlay: boolean;
  notifications: boolean;
  syncCoachToCloud: boolean;
};

export type UserDoc = {
  deviceId: string;
  displayName: string;
  email: string | null;
  phone: string | null;
  permissions: UserPermissions;
  paymentCustomerId: string | null;
  createdAt: string;
  updatedAt: string;
  state: {
    apps: unknown[];
    usage: unknown[];
    portfolio: unknown;
    coachSessions: unknown[];
    onboardingComplete: boolean;
  };
};

export type OtpDoc = {
  key: string;
  phone: string;
  email: string;
  code: string;
  expiresAt: Date;
};

async function ensureDirs(): Promise<void> {
  await fs.mkdir(USERS_DIR, { recursive: true });
  await fs.mkdir(LOGS_DIR, { recursive: true });
}

function userPath(deviceId: string): string {
  const safe = deviceId.replace(/[^a-zA-Z0-9_-]/g, '_');
  return path.join(USERS_DIR, `${safe}.json`);
}

function otpKey(phone: string, email: string): string {
  return `${phone}:${email.toLowerCase()}`;
}

export async function saveOtp(phone: string, email: string, code: string, ttlMs: number): Promise<void> {
  const key = otpKey(phone, email);
  const expiresAt = new Date(Date.now() + ttlMs);
  const db = await getDb();

  if (db) {
    await db.collection<OtpDoc>('otps').updateOne(
      { key },
      { $set: { key, phone, email: email.toLowerCase(), code, expiresAt } },
      { upsert: true }
    );
    return;
  }

  await ensureDirs();
  const file = path.join(LOGS_DIR, 'otps.json');
  let map: Record<string, OtpDoc> = {};
  try {
    map = JSON.parse(await fs.readFile(file, 'utf8')) as Record<string, OtpDoc>;
  } catch {
    /* empty */
  }
  map[key] = { key, phone, email: email.toLowerCase(), code, expiresAt };
  await fs.writeFile(file, JSON.stringify(map, null, 2));
}

export async function verifyOtp(phone: string, email: string, code: string): Promise<boolean> {
  const key = otpKey(phone, email);
  const db = await getDb();

  if (db) {
    const doc = await db.collection<OtpDoc>('otps').findOne({ key });
    if (!doc || doc.expiresAt < new Date() || doc.code !== code) return false;
    await db.collection('otps').deleteOne({ key });
    return true;
  }

  try {
    const file = path.join(LOGS_DIR, 'otps.json');
    const map = JSON.parse(await fs.readFile(file, 'utf8')) as Record<string, OtpDoc>;
    const doc = map[key];
    if (!doc || new Date(doc.expiresAt) < new Date() || doc.code !== code) return false;
    delete map[key];
    await fs.writeFile(file, JSON.stringify(map, null, 2));
    return true;
  } catch {
    return false;
  }
}

export async function readUser(deviceId: string): Promise<UserDoc | null> {
  const db = await getDb();
  if (db) {
    return db.collection<UserDoc>('users').findOne({ deviceId });
  }

  await ensureDirs();
  try {
    const raw = await fs.readFile(userPath(deviceId), 'utf8');
    return JSON.parse(raw) as UserDoc;
  } catch {
    return null;
  }
}

export async function writeUser(deviceId: string, doc: UserDoc): Promise<UserDoc> {
  const db = await getDb();
  if (db) {
    await db.collection<UserDoc>('users').updateOne({ deviceId }, { $set: doc }, { upsert: true });
    return doc;
  }

  await ensureDirs();
  await fs.writeFile(userPath(deviceId), JSON.stringify(doc, null, 2), 'utf8');
  return doc;
}

export async function deleteUser(deviceId: string): Promise<boolean> {
  const db = await getDb();
  if (db) {
    const result = await db.collection('users').deleteOne({ deviceId });
    return result.deletedCount === 1;
  }

  await ensureDirs();
  try {
    await fs.unlink(userPath(deviceId));
    return true;
  } catch {
    return false;
  }
}

export async function appendLog(entry: Record<string, unknown>): Promise<void> {
  const db = await getDb();
  if (db) {
    await db.collection('logs').insertOne({ ...entry, at: entry.at ?? new Date().toISOString() });
    return;
  }

  await ensureDirs();
  const day = new Date().toISOString().slice(0, 10);
  const file = path.join(LOGS_DIR, `${day}.jsonl`);
  await fs.appendFile(file, `${JSON.stringify(entry)}\n`, 'utf8');
}

export function defaultUser(deviceId: string, displayName?: string): UserDoc {
  const now = new Date().toISOString();
  return {
    deviceId,
    displayName: displayName ?? 'SCROLL user',
    email: null,
    phone: null,
    permissions: {
      shieldEnabled: true,
      usageStats: true,
      overlay: true,
      notifications: true,
      syncCoachToCloud: true,
    },
    paymentCustomerId: null,
    createdAt: now,
    updatedAt: now,
    state: {
      apps: [],
      usage: [],
      portfolio: {
        totalInvestedCents: 0,
        totalUnlockFeesCents: 0,
        estimatedYieldPercent: 4.8,
        lastContributionAt: null,
      },
      coachSessions: [],
      onboardingComplete: false,
    },
  };
}
