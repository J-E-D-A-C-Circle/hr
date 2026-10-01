const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function initDb() {
  const host = process.env.DB_HOST || '127.0.0.1';
  const port = process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306;
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : 'root';
  const database = process.env.DB_NAME || 'dvla_nss_portal';

  console.log(`🔌 Connecting to MySQL at ${host}:${port} as ${user}...`);

  try {
    // 1. Connect without database to ensure DB exists
    const conn = await mysql.createConnection({
      host,
      port,
      user,
      password,
      multipleStatements: true,
    });

    console.log(`📂 Ensuring database '${database}' exists...`);
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await conn.changeUser({ database });

    // 2. Check if users table exists
    const [tables] = await conn.query(`SHOW TABLES LIKE 'users'`);

    if (Array.isArray(tables) && tables.length > 0) {
      console.log(`✅ Database '${database}' is already initialized with required tables.`);
      await conn.end();
      return;
    }

    console.log(`⚡ Database '${database}' is empty. Initializing schema from SQL dump...`);
    const sqlFile = path.join(__dirname, '..', 'dvla_nss_portal.sql');
    
    if (fs.existsSync(sqlFile)) {
      const sqlContent = fs.readFileSync(sqlFile, 'utf8');
      await conn.query(sqlContent);
      console.log(`🎉 Schema successfully imported into '${database}'!`);
    } else {
      console.warn(`⚠️ Warning: dvla_nss_portal.sql not found at ${sqlFile}`);
    }

    await conn.end();
  } catch (error) {
    console.error(`❌ Database auto-initialization error:`, error.message);
    // Don't crash container on init check failure if DB is already set up
  }
}

initDb();
