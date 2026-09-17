import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import path from 'path';
import * as schema from './schema';

function getDatabasePath(): string {
  const envUrl = process.env.DATABASE_URL || 'file:./dev.db';
  let dbPath = envUrl.replace(/^file:/, '').trim();

  if (!path.isAbsolute(dbPath)) {
    dbPath = path.join(/*turbopackIgnore: true*/ process.cwd(), dbPath);
  }
  return dbPath;
}

const sqlite = new Database(getDatabasePath());

// Enable WAL mode for better concurrency performance
try {
  sqlite.pragma('journal_mode = WAL');
} catch {}

export const db = drizzle(sqlite, { schema });
export type DB = typeof db;
export * from './schema';
