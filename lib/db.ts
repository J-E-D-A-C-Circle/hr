import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import * as schema from '@/db/schema';

const rawPort = process.env.DB_PORT ? Number(process.env.DB_PORT) : null;
const dbPort = rawPort || 3307;

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : 'root',
  database: process.env.DB_NAME || 'dvla_nss_portal',
  port: dbPort,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+00:00',
});

export const db = drizzle(pool, { mode: 'default', schema });

export async function query<T = any>(sql: string, params: any[] = []): Promise<T> {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows as T;
  } catch (error: any) {
    console.error('Database query error:', error);
    throw error;
  }
}

let mustChangeColumnEnsured = false;

export async function ensureMustChangePasswordColumn(): Promise<void> {
  if (mustChangeColumnEnsured) return;
  try {
    const dbName = process.env.DB_NAME || 'dvla_nss_portal';
    const cols = await query<any[]>(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'must_change_password'`,
      [dbName]
    );
    if (!Array.isArray(cols) || cols.length === 0) {
      await query(`ALTER TABLE users ADD COLUMN must_change_password TINYINT(1) NOT NULL DEFAULT 0`);
    }
    mustChangeColumnEnsured = true;
  } catch (err) {
    console.warn('Could not verify must_change_password column:', err);
  }
}

export default pool;
