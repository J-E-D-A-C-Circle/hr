import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import * as schema from './schema';

const isProduction = process.env.NODE_ENV === 'production';
const rawPort = process.env.DB_PORT ? Number(process.env.DB_PORT) : null;
const dbPort = rawPort || 3306;

const connectionUri = process.env.DATABASE_URL;

let pool: mysql.Pool;

if (connectionUri && !connectionUri.startsWith('file:')) {
  pool = mysql.createPool({
    uri: connectionUri,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    timezone: '+00:00',
  });
} else {
  pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : 'root',
    database: process.env.DB_NAME || 'hr_validation_db',
    port: dbPort,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    timezone: '+00:00',
  });
}

export const db = drizzle(pool, { mode: 'default', schema });
export type DB = typeof db;
export * from './schema';
