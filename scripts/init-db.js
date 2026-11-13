#!/usr/bin/env node
/**
 * init-db.js — Production MySQL Database initialiser
 * Runs at container start via entrypoint.sh BEFORE Next.js server boots.
 * Connects to MySQL, creates tables if not present, and seeds essential admin and DVLA stations.
 */
'use strict';

const mysql = require('mysql2/promise');
const crypto = require('crypto');

function parseDbConfig() {
  const envUrl = process.env.DATABASE_URL;
  if (envUrl && !envUrl.startsWith('file:')) {
    try {
      const u = new URL(envUrl);
      return {
        host: u.hostname,
        port: parseInt(u.port || '3306', 10),
        user: decodeURIComponent(u.username),
        password: decodeURIComponent(u.password),
        database: u.pathname.replace(/^\//, ''),
      };
    } catch {}
  }
  return {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : 'root',
    database: process.env.DB_NAME || 'hr_validation_db',
  };
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function connectWithRetry(cfg, maxRetries = 25) {
  for (let i = 1; i <= maxRetries; i++) {
    try {
      console.log(`📡 Connecting to MySQL at ${cfg.host}:${cfg.port} (attempt ${i}/${maxRetries})...`);
      const conn = await mysql.createConnection({
        host: cfg.host,
        port: cfg.port,
        user: cfg.user,
        password: cfg.password,
        database: cfg.database,
      });
      console.log(`✅ Connected to MySQL database "${cfg.database}".`);
      return conn;
    } catch (err) {
      console.warn(`⏳ MySQL not ready yet (${err.message}). Waiting 4s...`);
      await sleep(4000);
    }
  }
  throw new Error(`Could not connect to MySQL at ${cfg.host}:${cfg.port} after ${maxRetries} attempts.`);
}

async function main() {
  const cfg = parseDbConfig();
  const conn = await connectWithRetry(cfg);

  try {
    console.log('🏗️  Verifying database schema...');
    
    await conn.query(`
      CREATE TABLE IF NOT EXISTS \`Region\` (
        \`id\` VARCHAR(36) PRIMARY KEY,
        \`name\` VARCHAR(255) NOT NULL UNIQUE,
        \`code\` VARCHAR(50) NOT NULL UNIQUE,
        \`createdAt\` VARCHAR(50),
        \`updatedAt\` VARCHAR(50)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS \`Branch\` (
        \`id\` VARCHAR(36) PRIMARY KEY,
        \`name\` VARCHAR(255) NOT NULL UNIQUE,
        \`code\` VARCHAR(50),
        \`regionId\` VARCHAR(36) NOT NULL,
        \`headName\` VARCHAR(255),
        \`headEmail\` VARCHAR(255),
        \`active\` BOOLEAN NOT NULL DEFAULT TRUE,
        \`createdAt\` VARCHAR(50),
        \`updatedAt\` VARCHAR(50),
        FOREIGN KEY (\`regionId\`) REFERENCES \`Region\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS \`User\` (
        \`id\` VARCHAR(36) PRIMARY KEY,
        \`name\` VARCHAR(255) NOT NULL,
        \`email\` VARCHAR(255) NOT NULL UNIQUE,
        \`passwordHash\` VARCHAR(255) NOT NULL,
        \`role\` VARCHAR(50) NOT NULL DEFAULT 'STATION_MANAGER',
        \`branchId\` VARCHAR(36),
        \`regionId\` VARCHAR(36),
        \`active\` BOOLEAN NOT NULL DEFAULT TRUE,
        \`createdAt\` VARCHAR(50),
        \`updatedAt\` VARCHAR(50),
        FOREIGN KEY (\`branchId\`) REFERENCES \`Branch\`(\`id\`) ON DELETE SET NULL,
        FOREIGN KEY (\`regionId\`) REFERENCES \`Region\`(\`id\`) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS \`Submission\` (
        \`id\` VARCHAR(36) PRIMARY KEY,
        \`branchId\` VARCHAR(36) NOT NULL,
        \`month\` INT NOT NULL,
        \`year\` INT NOT NULL,
        \`filePath\` VARCHAR(500) NOT NULL,
        \`fileName\` VARCHAR(255) NOT NULL,
        \`fileSize\` INT NOT NULL,
        \`note\` TEXT,
        \`uploadedById\` VARCHAR(36) NOT NULL,
        \`uploadedAt\` VARCHAR(50),
        \`status\` VARCHAR(50) NOT NULL DEFAULT 'PENDING',
        \`reviewerId\` VARCHAR(36),
        \`reviewerNotes\` TEXT,
        \`reviewedAt\` VARCHAR(50),
        \`resubmissionOfId\` VARCHAR(36),
        \`ocrPassed\` BOOLEAN NOT NULL DEFAULT TRUE,
        \`ocrText\` TEXT,
        \`staffType\` VARCHAR(50) NOT NULL DEFAULT 'PERMANENT',
        \`createdAt\` VARCHAR(50),
        \`updatedAt\` VARCHAR(50),
        FOREIGN KEY (\`branchId\`) REFERENCES \`Branch\`(\`id\`) ON DELETE CASCADE,
        FOREIGN KEY (\`uploadedById\`) REFERENCES \`User\`(\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS \`AuditLog\` (
        \`id\` VARCHAR(36) PRIMARY KEY,
        \`actorId\` VARCHAR(36),
        \`action\` VARCHAR(100) NOT NULL,
        \`targetType\` VARCHAR(100) NOT NULL,
        \`targetId\` VARCHAR(36),
        \`timestamp\` VARCHAR(50),
        \`metadata\` TEXT,
        FOREIGN KEY (\`actorId\`) REFERENCES \`User\`(\`id\`) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS \`DeadlineConfig\` (
        \`id\` VARCHAR(50) PRIMARY KEY DEFAULT 'default',
        \`cutoffDayOfMonth\` INT NOT NULL DEFAULT 21,
        \`reminderDaysBefore\` INT NOT NULL DEFAULT 3,
        \`updatedAt\` VARCHAR(50)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS \`Announcement\` (
        \`id\` VARCHAR(36) PRIMARY KEY,
        \`title\` VARCHAR(255) NOT NULL,
        \`content\` TEXT NOT NULL,
        \`priority\` VARCHAR(50) NOT NULL DEFAULT 'INFO',
        \`active\` BOOLEAN NOT NULL DEFAULT TRUE,
        \`author\` VARCHAR(255) NOT NULL DEFAULT 'HR Administration',
        \`createdAt\` VARCHAR(50),
        \`updatedAt\` VARCHAR(50)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS \`PolicyConfig\` (
        \`id\` VARCHAR(50) PRIMARY KEY DEFAULT 'default',
        \`maxFileSizeMb\` INT NOT NULL DEFAULT 30,
        \`requireSignature\` BOOLEAN NOT NULL DEFAULT TRUE,
        \`allowedFormats\` VARCHAR(100) NOT NULL DEFAULT 'PDF',
        \`guidelinesText\` TEXT,
        \`updatedAt\` VARCHAR(50)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Ensure default deadline config exists
    await conn.query(`
      INSERT IGNORE INTO \`DeadlineConfig\` (\`id\`, \`cutoffDayOfMonth\`, \`reminderDaysBefore\`, \`updatedAt\`)
      VALUES ('default', 21, 3, ?)
    `, [new Date().toISOString()]);

    // Ensure default policy config exists
    await conn.query(`
      INSERT IGNORE INTO \`PolicyConfig\` (\`id\`, \`maxFileSizeMb\`, \`requireSignature\`, \`allowedFormats\`, \`guidelinesText\`, \`updatedAt\`)
      VALUES ('default', 30, 1, 'PDF', 'All monthly payroll validation documents must be signed by the Station Manager and uploaded in PDF format prior to the 21st monthly cutoff.', ?)
    `, [new Date().toISOString()]);

    // Check if regions already seeded
    const [regRows] = await conn.query('SELECT COUNT(*) AS cnt FROM `Region`');
    if (regRows[0].cnt === 0) {
      console.log('🌱 Seeding DVLA Regions & Stations...');
      const regionsData = [
        { name: 'Greater Accra', code: 'GAR' },
        { name: 'Ashanti', code: 'AR' },
        { name: 'Western', code: 'WR' },
        { name: 'Eastern', code: 'ER' },
        { name: 'Central', code: 'CR' },
        { name: 'Northern', code: 'NR' },
        { name: 'Volta', code: 'VR' },
        { name: 'Upper East', code: 'UER' },
        { name: 'Upper West', code: 'UWR' },
        { name: 'Bono', code: 'BR' },
        { name: 'Bono East', code: 'BER' },
        { name: 'Ahafo', code: 'AHR' },
        { name: 'Oti', code: 'OR' },
        { name: 'Savannah', code: 'SR' },
        { name: 'North East', code: 'NER' },
        { name: 'Western North', code: 'WNR' },
      ];

      for (const r of regionsData) {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        await conn.query(
          'INSERT INTO `Region` (`id`, `name`, `code`, `createdAt`, `updatedAt`) VALUES (?, ?, ?, ?, ?)',
          [id, r.name, r.code, now, now]
        );
      }
    }

    // Check if admin user exists
    const [userRows] = await conn.query('SELECT COUNT(*) AS cnt FROM `User` WHERE `role` = ?', ['HR_ADMIN']);
    if (userRows[0].cnt === 0) {
      console.log('👤 Seeding default HR Admin user...');
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const bcrypt = require('bcryptjs');
      const hash = bcrypt.hashSync('admin123', 10);
      await conn.query(
        'INSERT INTO `User` (`id`, `name`, `email`, `passwordHash`, `role`, `active`, `createdAt`, `updatedAt`) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [id, 'HR Administrator', 'admin@dvla.gov.gh', hash, 'HR_ADMIN', 1, now, now]
      );
      console.log('   Email: admin@dvla.gov.gh | Password: admin123');
    }

    console.log('🎉 Database initialization complete!');
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error('❌ Failed to initialize database:', err);
  process.exit(1);
});
