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
      console.log('🌱 Seeding DVLA Regions...');
      const regionsData = [
        { name: 'Greater Accra Region', code: 'REG-ACCRA' },
        { name: 'Ashanti Region', code: 'REG-ASHANTI' },
        { name: 'Western Region', code: 'REG-WESTERN' },
        { name: 'Eastern Region', code: 'REG-EASTERN' },
        { name: 'Central Region', code: 'REG-CENTRAL' },
        { name: 'Northern Region', code: 'REG-NORTHERN' },
        { name: 'Volta Region', code: 'REG-VOLTA' },
        { name: 'Upper East Region', code: 'REG-UPPEREAST' },
        { name: 'Upper West Region', code: 'REG-UPPERWEST' },
        { name: 'Bono Region', code: 'REG-BONO' },
        { name: 'Bono East Region', code: 'REG-BONOEAST' },
        { name: 'Ahafo Region', code: 'REG-AHAFO' },
        { name: 'Western North Region', code: 'REG-WESTERNNORTH' },
        { name: 'Oti Region', code: 'REG-OTI' },
        { name: 'Savannah Region', code: 'REG-SAVANNAH' },
        { name: 'North East Region', code: 'REG-NORTHEAST' },
      ];

      for (const r of regionsData) {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        await conn.query(
          'INSERT IGNORE INTO `Region` (`id`, `name`, `code`, `createdAt`, `updatedAt`) VALUES (?, ?, ?, ?, ?)',
          [id, r.name, r.code, now, now]
        );
      }
    }

    // Official 66 DVLA Stations matching staff-management
    const dvlaStationsList = [
      // Greater Accra Region
      { code: 'DVLA-ACC-01', name: 'HEAD OFFICE', regionCode: 'REG-ACCRA', headName: 'Emmanuel Mensah', headEmail: 'head.headoffice@pvc.local' },
      { code: 'DVLA-ACC-02', name: 'NARMAH/HAATSO/ACCRA OFFICE', regionCode: 'REG-ACCRA', headName: 'Abena Osei', headEmail: 'head.haatso@pvc.local' },
      { code: 'DVLA-ACC-03', name: 'TEMA', regionCode: 'REG-ACCRA', headName: 'Kofi Annan', headEmail: 'head.tema@pvc.local' },
      { code: 'DVLA-ACC-04', name: 'WEIJA', regionCode: 'REG-ACCRA', headName: 'Akua Donkor', headEmail: 'head.weija@pvc.local' },
      { code: 'DVLA-ACC-05', name: 'ADENTAN', regionCode: 'REG-ACCRA', headName: 'Kwame Nkrumah', headEmail: 'head.adentan@pvc.local' },
      { code: 'DVLA-ACC-06', name: 'DANSOMAN', regionCode: 'REG-ACCRA', headName: 'Joseph Botchway', headEmail: 'head.dansoman@pvc.local' },
      { code: 'DVLA-ACC-07', name: 'CIRCLE', regionCode: 'REG-ACCRA', headName: 'Rita Addo', headEmail: 'head.circle@pvc.local' },
      { code: 'DVLA-ACC-08', name: 'SPINTEX', regionCode: 'REG-ACCRA', headName: 'Samuel Quaye', headEmail: 'head.spintex@pvc.local' },
      { code: 'DVLA-ACC-09', name: 'ASHAIMAN', regionCode: 'REG-ACCRA', headName: 'Grace Aryee', headEmail: 'head.ashaiman@pvc.local' },
      { code: 'DVLA-ACC-10', name: 'ANYAA', regionCode: 'REG-ACCRA', headName: 'David Lamptey', headEmail: 'head.anyaa@pvc.local' },
      { code: 'DVLA-ACC-11', name: 'TESHIE', regionCode: 'REG-ACCRA', headName: 'Comfort Sowah', headEmail: 'head.teshie@pvc.local' },
      { code: 'DVLA-ACC-12', name: 'DOME', regionCode: 'REG-ACCRA', headName: 'Isaac Tetteh', headEmail: 'head.dome@pvc.local' },
      { code: 'DVLA-ACC-13', name: 'AMRAHIA', regionCode: 'REG-ACCRA', headName: 'Mary Ayitey', headEmail: 'head.amrahia@pvc.local' },
      { code: 'DVLA-ACC-14', name: 'KWABENYA', regionCode: 'REG-ACCRA', headName: 'Daniel Nortey', headEmail: 'head.kwabenya@pvc.local' },

      // Ashanti Region
      { code: 'DVLA-ASH-01', name: 'KUMASI', regionCode: 'REG-ASHANTI', headName: 'Kwadwo Poku', headEmail: 'head.kumasi@pvc.local' },
      { code: 'DVLA-ASH-02', name: 'OBUASI', regionCode: 'REG-ASHANTI', headName: 'Yaw Boakye', headEmail: 'head.obuasi@pvc.local' },
      { code: 'DVLA-ASH-03', name: 'MAMPONG ASHANTI', regionCode: 'REG-ASHANTI', headName: 'Yaa Asantewaa', headEmail: 'head.mampongash@pvc.local' },
      { code: 'DVLA-ASH-04', name: 'AGONA-ASHANTI', regionCode: 'REG-ASHANTI', headName: 'Kwabena Appiah', headEmail: 'head.agonaash@pvc.local' },
      { code: 'DVLA-ASH-05', name: 'BEKWAI', regionCode: 'REG-ASHANTI', headName: 'Akosua Darko', headEmail: 'head.bekwai@pvc.local' },
      { code: 'DVLA-ASH-06', name: 'OFFINSO', regionCode: 'REG-ASHANTI', headName: 'Kofi Sarfo', headEmail: 'head.offinso@pvc.local' },
      { code: 'DVLA-ASH-07', name: 'EFFIDUASI', regionCode: 'REG-ASHANTI', headName: 'Ama Agyei', headEmail: 'head.effiduasi@pvc.local' },
      { code: 'DVLA-ASH-08', name: 'KUMAWU', regionCode: 'REG-ASHANTI', headName: 'Kwaku Duah', headEmail: 'head.kumawu@pvc.local' },
      { code: 'DVLA-ASH-09', name: 'BANTAMA', regionCode: 'REG-ASHANTI', headName: 'Nana Prempeh', headEmail: 'head.bantama@pvc.local' },
      { code: 'DVLA-ASH-10', name: 'BONWIRE', regionCode: 'REG-ASHANTI', headName: 'Adwoa Kyeremaa', headEmail: 'head.bonwire@pvc.local' },
      { code: 'DVLA-ASH-11', name: 'ADUM', regionCode: 'REG-ASHANTI', headName: 'Kwabena Frimpong', headEmail: 'head.adum@pvc.local' },
      { code: 'DVLA-ASH-12', name: 'ABUAKWA', regionCode: 'REG-ASHANTI', headName: 'Osei Tutu', headEmail: 'head.abuakwa@pvc.local' },

      // Eastern Region
      { code: 'DVLA-EST-01', name: 'KOFORIDUA', regionCode: 'REG-EASTERN', headName: 'Kwaku Addo', headEmail: 'head.koforidua@pvc.local' },
      { code: 'DVLA-EST-02', name: 'NKAWKAW', regionCode: 'REG-EASTERN', headName: 'Afia Mansa', headEmail: 'head.nkawkaw@pvc.local' },
      { code: 'DVLA-EST-03', name: 'AKIM ODA', regionCode: 'REG-EASTERN', headName: 'Yaw Asare', headEmail: 'head.akimoda@pvc.local' },
      { code: 'DVLA-EST-04', name: 'AKWATIA', regionCode: 'REG-EASTERN', headName: 'Ebenezer Boateng', headEmail: 'head.akwatia@pvc.local' },
      { code: 'DVLA-EST-05', name: 'ASUOGYAMAN OFFICE', regionCode: 'REG-EASTERN', headName: 'Gifty Ofori', headEmail: 'head.asuogyaman@pvc.local' },
      { code: 'DVLA-EST-06', name: 'ASAMANKESE', regionCode: 'REG-EASTERN', headName: 'Seth Danquah', headEmail: 'head.asamankese@pvc.local' },
      { code: 'DVLA-EST-07', name: 'NSAWAM', regionCode: 'REG-EASTERN', headName: 'Paulina Baah', headEmail: 'head.nsawam@pvc.local' },

      // Central Region
      { code: 'DVLA-CNT-01', name: 'CAPE-COAST', regionCode: 'REG-CENTRAL', headName: 'Kojo Mills', headEmail: 'head.capecoast@pvc.local' },
      { code: 'DVLA-CNT-02', name: 'WINNEBA', regionCode: 'REG-CENTRAL', headName: 'Araba Koomson', headEmail: 'head.winneba@pvc.local' },
      { code: 'DVLA-CNT-03', name: 'DUNKWA-ON-OFFIN', regionCode: 'REG-CENTRAL', headName: 'Kwesi Arthur', headEmail: 'head.dunkwa@pvc.local' },
      { code: 'DVLA-CNT-04', name: 'TWIFO PRASO', regionCode: 'REG-CENTRAL', headName: 'Esi Atta', headEmail: 'head.twifopraso@pvc.local' },
      { code: 'DVLA-CNT-05', name: 'KASOA', regionCode: 'REG-CENTRAL', headName: 'Kobina Ghartey', headEmail: 'head.kasoa@pvc.local' },

      // Western Region
      { code: 'DVLA-WST-01', name: 'TAKORADI', regionCode: 'REG-WESTERN', headName: 'Ebo Quansah', headEmail: 'head.takoradi@pvc.local' },
      { code: 'DVLA-WST-02', name: 'TARKWA', regionCode: 'REG-WESTERN', headName: 'Ama Serwaa', headEmail: 'head.tarkwa@pvc.local' },
      { code: 'DVLA-WST-03', name: 'AXIM', regionCode: 'REG-WESTERN', headName: 'Francis Cudjoe', headEmail: 'head.axim@pvc.local' },

      // Western North Region
      { code: 'DVLA-WNO-01', name: 'SEFWI WIAWSO', regionCode: 'REG-WESTERNNORTH', headName: 'Nana Gyasi', headEmail: 'head.sefwiawso@pvc.local' },

      // Volta Region
      { code: 'DVLA-VLT-01', name: 'HO', regionCode: 'REG-VOLTA', headName: 'Fafali Agbeko', headEmail: 'head.ho@pvc.local' },
      { code: 'DVLA-VLT-02', name: 'HOHOE', regionCode: 'REG-VOLTA', headName: 'Kwami Gbeho', headEmail: 'head.hohoe@pvc.local' },
      { code: 'DVLA-VLT-03', name: 'AKATSI', regionCode: 'REG-VOLTA', headName: 'Dzidzor Ahiable', headEmail: 'head.akatsi@pvc.local' },
      { code: 'DVLA-VLT-04', name: 'DENU', regionCode: 'REG-VOLTA', headName: 'Mawuli Dzokoto', headEmail: 'head.denu@pvc.local' },
      { code: 'DVLA-VLT-05', name: 'NORTH DAYI', regionCode: 'REG-VOLTA', headName: 'Senyo Mensah', headEmail: 'head.northdayi@pvc.local' },

      // Oti Region
      { code: 'DVLA-OTI-01', name: 'BUEM-JASIKAN', regionCode: 'REG-OTI', headName: 'Ketan Krakani', headEmail: 'head.buemjasikan@pvc.local' },

      // Northern Region
      { code: 'DVLA-NTH-01', name: 'TAMALE', regionCode: 'REG-NORTHERN', headName: 'Ibrahim Alhassan', headEmail: 'head.tamale@pvc.local' },
      { code: 'DVLA-NTH-02', name: 'YENDI OFFICE', regionCode: 'REG-NORTHERN', headName: 'Yakubu Andani', headEmail: 'head.yendi@pvc.local' },

      // North East Region
      { code: 'DVLA-NER-01', name: 'NALERIGU OFFICE', regionCode: 'REG-NORTHEAST', headName: 'Mahamadu Bawumia', headEmail: 'head.nalerigu@pvc.local' },

      // Savannah Region
      { code: 'DVLA-SAV-01', name: 'BOLE', regionCode: 'REG-SAVANNAH', headName: 'Jigba Mahama', headEmail: 'head.bole@pvc.local' },
      { code: 'DVLA-SAV-02', name: 'SALAGA OFFICE', regionCode: 'REG-SAVANNAH', headName: 'Seidu Mahama', headEmail: 'head.salaga@pvc.local' },

      // Upper East Region
      { code: 'DVLA-UEA-01', name: 'BOLGATANGA', regionCode: 'REG-UPPEREAST', headName: 'Azonko Atia', headEmail: 'head.bolgatanga@pvc.local' },
      { code: 'DVLA-UEA-02', name: 'NAVRONGO OFFICE', regionCode: 'REG-UPPEREAST', headName: 'Apambire Ayine', headEmail: 'head.navrongo@pvc.local' },

      // Upper West Region
      { code: 'DVLA-UWE-01', name: 'WA', regionCode: 'REG-UPPERWEST', headName: 'Dery Kuanyir', headEmail: 'head.wa@pvc.local' },
      { code: 'DVLA-UWE-02', name: 'TUMU OFFICE', regionCode: 'REG-UPPERWEST', headName: 'Bayor Kanton', headEmail: 'head.tumu@pvc.local' },

      // Bono Region
      { code: 'DVLA-BON-01', name: 'SUNYANI', regionCode: 'REG-BONO', headName: 'Kwasi Busia', headEmail: 'head.sunyani@pvc.local' },
      { code: 'DVLA-BON-02', name: 'DORMAA', regionCode: 'REG-BONO', headName: 'Agyemang Badu', headEmail: 'head.dormaa@pvc.local' },
      { code: 'DVLA-BON-03', name: 'WENCHI', regionCode: 'REG-BONO', headName: 'Kofi Abrefa', headEmail: 'head.wenchi@pvc.local' },

      // Bono East Region
      { code: 'DVLA-BOE-01', name: 'TECHIMAN', regionCode: 'REG-BONOEAST', headName: 'Adwoa Fosuah', headEmail: 'head.techiman@pvc.local' },
      { code: 'DVLA-BOE-02', name: 'KINTAMPO', regionCode: 'REG-BONOEAST', headName: 'Kwame Baafi', headEmail: 'head.kintampo@pvc.local' },
      { code: 'DVLA-BOE-03', name: 'NKORANZA OFFICE', regionCode: 'REG-BONOEAST', headName: 'Ohene Djan', headEmail: 'head.nkoranza@pvc.local' },
      { code: 'DVLA-BOE-04', name: 'ATEBUBU', regionCode: 'REG-BONOEAST', headName: 'Ameyaw Akumfi', headEmail: 'head.atebubu@pvc.local' },

      // Ahafo Region
      { code: 'DVLA-AHF-01', name: 'GOASO', regionCode: 'REG-AHAFO', headName: 'Kofi Tuah', headEmail: 'head.goaso@pvc.local' },
      { code: 'DVLA-AHF-02', name: 'BECHEM', regionCode: 'REG-AHAFO', headName: 'Akua Pokua', headEmail: 'head.bechem@pvc.local' },
    ];

    // Seed branches if not present
    const [branchRows] = await conn.query('SELECT COUNT(*) AS cnt FROM `Branch`');
    if (branchRows[0].cnt === 0) {
      console.log('🏛️ Seeding 66 Official DVLA Stations from staff-management...');
      const [allRegions] = await conn.query('SELECT `id`, `code` FROM `Region`');
      const regMap = {};
      for (const reg of allRegions) {
        regMap[reg.code] = reg.id;
      }
      const defaultRegId = allRegions[0]?.id;

      for (const st of dvlaStationsList) {
        const branchId = crypto.randomUUID();
        const regId = regMap[st.regionCode] || defaultRegId;
        const now = new Date().toISOString();
        await conn.query(
          'INSERT IGNORE INTO `Branch` (`id`, `name`, `code`, `regionId`, `headName`, `headEmail`, `active`, `createdAt`, `updatedAt`) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)',
          [branchId, st.name, null, regId, st.headName, st.headEmail, now, now]
        );
      }
      console.log(`✅ Successfully seeded ${dvlaStationsList.length} Official DVLA Stations!`);
    } else {
      // Clear auto-seeded DVLA-* station codes on existing databases
      await conn.query("UPDATE `Branch` SET `code` = NULL WHERE `code` LIKE 'DVLA-%'");
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
