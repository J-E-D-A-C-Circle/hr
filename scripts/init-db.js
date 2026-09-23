#!/usr/bin/env node
/**
 * init-db.js — Production DB initialiser (CommonJS, no TypeScript needed)
 * Runs at container start via entrypoint.sh BEFORE the Next.js server boots.
 * Creates tables and seeds essential data if the database is empty.
 */
'use strict';

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// ── Resolve database path ─────────────────────────────────────────────────────
const envUrl = process.env.DATABASE_URL || 'file:./dev.db';
let dbPath = envUrl.replace(/^file:/, '').trim();
if (!path.isAbsolute(dbPath)) {
  dbPath = path.join(process.cwd(), dbPath);
}

// Ensure the parent directory exists and is writable
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

console.log(`📂 Database path: ${dbPath}`);

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ── Create tables ─────────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS "Region" (
    "id"        TEXT PRIMARY KEY,
    "name"      TEXT NOT NULL UNIQUE,
    "code"      TEXT NOT NULL UNIQUE,
    "createdAt" TEXT,
    "updatedAt" TEXT
  );

  CREATE TABLE IF NOT EXISTS "Branch" (
    "id"        TEXT PRIMARY KEY,
    "name"      TEXT NOT NULL UNIQUE,
    "code"      TEXT,
    "regionId"  TEXT NOT NULL REFERENCES "Region"("id") ON DELETE CASCADE,
    "headName"  TEXT,
    "headEmail" TEXT,
    "active"    INTEGER NOT NULL DEFAULT 1,
    "createdAt" TEXT,
    "updatedAt" TEXT
  );
  CREATE INDEX IF NOT EXISTS branch_region_idx ON "Branch"("regionId");
  CREATE INDEX IF NOT EXISTS branch_active_idx ON "Branch"("active");

  CREATE TABLE IF NOT EXISTS "User" (
    "id"           TEXT PRIMARY KEY,
    "name"         TEXT NOT NULL,
    "email"        TEXT NOT NULL UNIQUE,
    "passwordHash" TEXT NOT NULL,
    "role"         TEXT NOT NULL DEFAULT 'STATION_MANAGER',
    "branchId"     TEXT REFERENCES "Branch"("id") ON DELETE SET NULL,
    "regionId"     TEXT REFERENCES "Region"("id") ON DELETE SET NULL,
    "active"       INTEGER NOT NULL DEFAULT 1,
    "createdAt"    TEXT,
    "updatedAt"    TEXT
  );
  CREATE INDEX IF NOT EXISTS user_branch_idx     ON "User"("branchId");
  CREATE INDEX IF NOT EXISTS user_region_idx     ON "User"("regionId");
  CREATE INDEX IF NOT EXISTS user_role_idx       ON "User"("role");
  CREATE INDEX IF NOT EXISTS user_role_branch_idx ON "User"("role","branchId");
  CREATE INDEX IF NOT EXISTS user_active_idx     ON "User"("active");

  CREATE TABLE IF NOT EXISTS "Submission" (
    "id"               TEXT PRIMARY KEY,
    "branchId"         TEXT NOT NULL REFERENCES "Branch"("id") ON DELETE CASCADE,
    "month"            INTEGER NOT NULL,
    "year"             INTEGER NOT NULL,
    "filePath"         TEXT NOT NULL,
    "fileName"         TEXT NOT NULL,
    "fileSize"         INTEGER NOT NULL,
    "note"             TEXT,
    "uploadedById"     TEXT NOT NULL REFERENCES "User"("id"),
    "uploadedAt"       TEXT,
    "status"           TEXT NOT NULL DEFAULT 'PENDING',
    "reviewerId"       TEXT REFERENCES "User"("id"),
    "reviewerNotes"    TEXT,
    "reviewedAt"       TEXT,
    "resubmissionOfId" TEXT,
    "ocrPassed"        INTEGER NOT NULL DEFAULT 1,
    "ocrText"          TEXT,
    "staffType"        TEXT NOT NULL DEFAULT 'PERMANENT',
    "createdAt"        TEXT,
    "updatedAt"        TEXT
  );
  CREATE INDEX IF NOT EXISTS sub_branch_ym_idx   ON "Submission"("branchId","year","month");
  CREATE INDEX IF NOT EXISTS sub_branch_sym_idx  ON "Submission"("branchId","status","year","month");
  CREATE INDEX IF NOT EXISTS sub_status_idx      ON "Submission"("status");
  CREATE INDEX IF NOT EXISTS sub_ym_idx          ON "Submission"("year","month");
  CREATE INDEX IF NOT EXISTS sub_staff_type_idx  ON "Submission"("staffType");
  CREATE INDEX IF NOT EXISTS sub_uploader_idx    ON "Submission"("uploadedById");
  CREATE INDEX IF NOT EXISTS sub_reviewer_idx    ON "Submission"("reviewerId");

  CREATE TABLE IF NOT EXISTS "AuditLog" (
    "id"         TEXT PRIMARY KEY,
    "actorId"    TEXT REFERENCES "User"("id") ON DELETE SET NULL,
    "action"     TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId"   TEXT,
    "timestamp"  TEXT,
    "metadata"   TEXT
  );
  CREATE INDEX IF NOT EXISTS audit_actor_idx  ON "AuditLog"("actorId");
  CREATE INDEX IF NOT EXISTS audit_action_idx ON "AuditLog"("action");
  CREATE INDEX IF NOT EXISTS audit_ts_idx     ON "AuditLog"("timestamp");

  CREATE TABLE IF NOT EXISTS "DeadlineConfig" (
    "id"                TEXT PRIMARY KEY DEFAULT 'default',
    "cutoffDayOfMonth"  INTEGER NOT NULL DEFAULT 21,
    "reminderDaysBefore" INTEGER NOT NULL DEFAULT 3,
    "updatedAt"         TEXT
  );

  CREATE TABLE IF NOT EXISTS "Announcement" (
    "id"        TEXT PRIMARY KEY,
    "title"     TEXT NOT NULL,
    "content"   TEXT NOT NULL,
    "priority"  TEXT NOT NULL DEFAULT 'INFO',
    "active"    INTEGER NOT NULL DEFAULT 1,
    "author"    TEXT NOT NULL DEFAULT 'HR Administration',
    "createdAt" TEXT,
    "updatedAt" TEXT
  );

  CREATE TABLE IF NOT EXISTS "PolicyConfig" (
    "id"               TEXT PRIMARY KEY DEFAULT 'default',
    "maxFileSizeMb"    INTEGER NOT NULL DEFAULT 30,
    "requireSignature" INTEGER NOT NULL DEFAULT 1,
    "allowedFormats"   TEXT NOT NULL DEFAULT 'PDF',
    "guidelinesText"   TEXT NOT NULL DEFAULT 'All monthly payroll validation documents must be signed by the Station Manager and uploaded in PDF format prior to the 21st monthly cutoff.',
    "updatedAt"        TEXT
  );
`);

console.log('✅ All tables created / verified.');

// ── Helper ────────────────────────────────────────────────────────────────────
function uid() { return crypto.randomUUID(); }
function now() { return new Date().toISOString(); }

// ── Seed only if User table is empty ─────────────────────────────────────────
const userCount = db.prepare('SELECT COUNT(*) as c FROM "User"').get().c;
if (userCount > 0) {
  console.log(`ℹ️  Database already seeded (${userCount} users found). Skipping seed.`);
  db.close();
  process.exit(0);
}

console.log('🌱 Seeding initial data...');

// bcryptjs hash for "password123" (cost 10) — pre-computed so we don't need the lib at init time
// Generate fresh: node -e "require('bcryptjs').hash('password123',10).then(console.log)"
// We do it dynamically here so the hash is always valid.
let bcrypt;
try { bcrypt = require('bcryptjs'); } catch { bcrypt = null; }
const PASSWORD = 'password123';
const passwordHash = bcrypt
  ? bcrypt.hashSync(PASSWORD, 10)
  : '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVdlJXNGh6'; // fallback hash for "password123"

// Deadline & Policy
db.prepare(`INSERT OR IGNORE INTO "DeadlineConfig" (id, cutoffDayOfMonth, reminderDaysBefore, updatedAt) VALUES ('default', 21, 3, ?)`).run(now());
db.prepare(`INSERT OR IGNORE INTO "PolicyConfig" (id, maxFileSizeMb, requireSignature, allowedFormats, guidelinesText, updatedAt) VALUES ('default', 30, 1, 'PDF', 'All monthly payroll validation documents must be signed by the Station Manager and uploaded in PDF format prior to the 21st monthly cutoff.', ?)`).run(now());

// Regions
const regionsData = [
  { name: 'Greater Accra Region',  code: 'REG-ACCRA' },
  { name: 'Ashanti Region',        code: 'REG-ASHANTI' },
  { name: 'Western Region',        code: 'REG-WESTERN' },
  { name: 'Eastern Region',        code: 'REG-EASTERN' },
  { name: 'Central Region',        code: 'REG-CENTRAL' },
  { name: 'Northern Region',       code: 'REG-NORTHERN' },
  { name: 'Volta Region',          code: 'REG-VOLTA' },
  { name: 'Upper East Region',     code: 'REG-UPPEREAST' },
  { name: 'Upper West Region',     code: 'REG-UPPERWEST' },
  { name: 'Bono Region',           code: 'REG-BONO' },
  { name: 'Bono East Region',      code: 'REG-BONOEAST' },
  { name: 'Ahafo Region',          code: 'REG-AHAFO' },
  { name: 'Western North Region',  code: 'REG-WESTERNNORTH' },
  { name: 'Oti Region',            code: 'REG-OTI' },
  { name: 'Savannah Region',       code: 'REG-SAVANNAH' },
];

const insertRegion = db.prepare(`INSERT OR IGNORE INTO "Region" (id, name, code, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)`);
const regionMap = {};
for (const r of regionsData) {
  const id = uid();
  insertRegion.run(id, r.name, r.code, now(), now());
  const row = db.prepare(`SELECT id FROM "Region" WHERE code = ?`).get(r.code);
  regionMap[r.code] = row.id;
}

const accraId = regionMap['REG-ACCRA'];

// Admin & Finance users
const insertUser = db.prepare(`INSERT OR IGNORE INTO "User" (id, name, email, passwordHash, role, regionId, branchId, active, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, NULL, 1, ?, ?)`);
insertUser.run(uid(), 'HR Administration Head', 'admin@pvc.local',   passwordHash, 'HR_ADMIN',       accraId, now(), now());
insertUser.run(uid(), 'Finance Audit Officer',  'finance@pvc.local', passwordHash, 'FINANCE_OFFICER', accraId, now(), now());

// DVLA Stations
const stations = [
  { code: 'DVLA-ACC-01', name: '37 Station - Accra Head Office',  regionCode: 'REG-ACCRA',       headName: 'Emmanuel Mensah',  headEmail: 'head.acc01@pvc.local' },
  { code: 'DVLA-ACC-02', name: 'Weija Station',                   regionCode: 'REG-ACCRA',       headName: 'Abena Osei',       headEmail: 'head.acc02@pvc.local' },
  { code: 'DVLA-ACC-03', name: 'Tema Station',                    regionCode: 'REG-ACCRA',       headName: 'Kofi Annan',       headEmail: 'head.acc03@pvc.local' },
  { code: 'DVLA-ACC-04', name: 'Amasaman Station',                regionCode: 'REG-ACCRA',       headName: 'Akua Donkor',      headEmail: 'head.acc04@pvc.local' },
  { code: 'DVLA-ACC-05', name: 'Madina Station',                  regionCode: 'REG-ACCRA',       headName: 'Kwame Nkrumah',    headEmail: 'head.acc05@pvc.local' },
  { code: 'DVLA-ASH-01', name: 'Kumasi Central Station',          regionCode: 'REG-ASHANTI',     headName: 'Kwadwo Poku',      headEmail: 'head.ash01@pvc.local' },
  { code: 'DVLA-ASH-02', name: 'Mampong Station',                 regionCode: 'REG-ASHANTI',     headName: 'Yaa Asantewaa',    headEmail: 'head.ash02@pvc.local' },
  { code: 'DVLA-ASH-03', name: 'Obuasi Station',                  regionCode: 'REG-ASHANTI',     headName: 'Yaw Boakye',       headEmail: 'head.ash03@pvc.local' },
  { code: 'DVLA-WST-01', name: 'Takoradi Station',                regionCode: 'REG-WESTERN',     headName: 'Ebo Quansah',      headEmail: 'head.wst01@pvc.local' },
  { code: 'DVLA-WST-02', name: 'Tarkwa Station',                  regionCode: 'REG-WESTERN',     headName: 'Ama Serwaa',       headEmail: 'head.wst02@pvc.local' },
  { code: 'DVLA-EST-01', name: 'Koforidua Station',               regionCode: 'REG-EASTERN',     headName: 'Kwaku Addo',       headEmail: 'head.est01@pvc.local' },
  { code: 'DVLA-EST-02', name: 'Nkawkaw Station',                 regionCode: 'REG-EASTERN',     headName: 'Afia Mansa',       headEmail: 'head.est02@pvc.local' },
  { code: 'DVLA-CNT-01', name: 'Cape Coast Station',              regionCode: 'REG-CENTRAL',     headName: 'Kojo Mills',       headEmail: 'head.cnt01@pvc.local' },
  { code: 'DVLA-CNT-02', name: 'Winneba Station',                 regionCode: 'REG-CENTRAL',     headName: 'Araba Koomson',    headEmail: 'head.cnt02@pvc.local' },
  { code: 'DVLA-NTH-01', name: 'Tamale Main Station',             regionCode: 'REG-NORTHERN',    headName: 'Ibrahim Alhassan', headEmail: 'head.nth01@pvc.local' },
  { code: 'DVLA-VLT-01', name: 'Ho Main Station',                 regionCode: 'REG-VOLTA',       headName: 'Fafali Agbeko',    headEmail: 'head.vlt01@pvc.local' },
  { code: 'DVLA-UEA-01', name: 'Bolgatanga Station',              regionCode: 'REG-UPPEREAST',   headName: 'Azonko Atia',      headEmail: 'head.uea01@pvc.local' },
  { code: 'DVLA-UWE-01', name: 'Wa Main Station',                 regionCode: 'REG-UPPERWEST',   headName: 'Dery Kuanyir',     headEmail: 'head.uwe01@pvc.local' },
  { code: 'DVLA-BON-01', name: 'Sunyani Station',                 regionCode: 'REG-BONO',        headName: 'Kwasi Busia',      headEmail: 'head.bon01@pvc.local' },
  { code: 'DVLA-BOE-01', name: 'Techiman Station',                regionCode: 'REG-BONOEAST',    headName: 'Adwoa Fosuah',     headEmail: 'head.boe01@pvc.local' },
  { code: 'DVLA-AHF-01', name: 'Goaso Station',                   regionCode: 'REG-AHAFO',       headName: 'Kofi Tuah',        headEmail: 'head.ahf01@pvc.local' },
  { code: 'DVLA-WNO-01', name: 'Sefwi Wiawso Station',            regionCode: 'REG-WESTERNNORTH',headName: 'Nana Gyasi',       headEmail: 'head.wno01@pvc.local' },
  { code: 'DVLA-OTI-01', name: 'Dambai Station',                  regionCode: 'REG-OTI',         headName: 'Ketan Krakani',    headEmail: 'head.oti01@pvc.local' },
  { code: 'DVLA-SAV-01', name: 'Damongo Station',                  regionCode: 'REG-SAVANNAH',    headName: 'Seidu Mahama',     headEmail: 'head.sav01@pvc.local' },
];

const insertBranch = db.prepare(`INSERT OR IGNORE INTO "Branch" (id, name, code, regionId, headName, headEmail, active, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`);
const insertStationUser = db.prepare(`INSERT OR IGNORE INTO "User" (id, name, email, passwordHash, role, branchId, regionId, active, createdAt, updatedAt) VALUES (?, ?, ?, ?, 'STATION_MANAGER', ?, ?, 1, ?, ?)`);

for (const s of stations) {
  const regId = regionMap[s.regionCode] || accraId;
  const branchId = uid();
  insertBranch.run(branchId, s.name, s.code, regId, s.headName, s.headEmail, now(), now());
  const row = db.prepare(`SELECT id FROM "Branch" WHERE code = ?`).get(s.code);
  const actualBranchId = row ? row.id : branchId;
  insertStationUser.run(uid(), s.headName, s.headEmail, passwordHash, actualBranchId, regId, now(), now());
}

console.log(`✅ Seeded ${stations.length} DVLA stations + admin accounts.`);
console.log('🎉 Database initialisation complete!');

db.close();
