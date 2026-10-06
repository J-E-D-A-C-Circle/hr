const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// Parse CLI flags (e.g., --email1=... --pass1=...)
function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {};
  for (const arg of args) {
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=');
      if (key && value !== undefined) {
        parsed[key] = value;
      }
    }
  }
  return parsed;
}

// Read database configuration with multi-port / docker fallback
function getDbConfigs() {
  let envFile = {};
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const raw = fs.readFileSync(envPath, 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const k = trimmed.slice(0, idx).trim();
        const v = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');
        envFile[k] = v;
      }
    }
  }

  const configs = [
    // 1. Host docker mapped port 3307
    {
      host: process.env.DB_HOST || '127.0.0.1',
      port: 3307,
      user: process.env.DB_USER || 'hr_user',
      password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : 'hr_password',
      database: process.env.DB_NAME || 'dvla_nss_portal',
    },
    // 2. Standard MySQL port 3306
    {
      host: process.env.DB_HOST || '127.0.0.1',
      port: 3306,
      user: process.env.DB_USER || 'hr_user',
      password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : 'hr_password',
      database: process.env.DB_NAME || 'dvla_nss_portal',
    },
    // 3. Fallback root user
    {
      host: process.env.DB_HOST || '127.0.0.1',
      port: 3307,
      user: 'root',
      password: 'hr_root_password',
      database: 'dvla_nss_portal',
    },
    {
      host: process.env.DB_HOST || '127.0.0.1',
      port: 3306,
      user: 'root',
      password: 'root',
      database: 'dvla_nss_portal',
    },
  ];

  return configs;
}

async function getConnection() {
  const configs = getDbConfigs();
  let lastError = null;

  for (const cfg of configs) {
    try {
      const conn = await mysql.createConnection(cfg);
      return { conn, config: cfg };
    } catch (err) {
      lastError = err;
    }
  }

  throw new Error(`Failed to connect to MySQL database: ${lastError ? lastError.message : 'Unknown error'}`);
}

async function addAdminAccounts() {
  const cliArgs = parseArgs();

  // Define the 2 admin accounts (can be overridden via CLI flags)
  const adminAccounts = [
    {
      fullName: cliArgs.name1 || 'DVLA HR Supervisor',
      email: (cliArgs.email1 || 'hradmin@dvla.gov.gh').toLowerCase().trim(),
      password: cliArgs.pass1 || cliArgs.password1 || 'AdminPass@2026',
    },
    {
      fullName: cliArgs.name2 || 'DVLA Regional Director',
      email: (cliArgs.email2 || 'director@dvla.gov.gh').toLowerCase().trim(),
      password: cliArgs.pass2 || cliArgs.password2 || 'AdminPass@2026',
    },
  ];

  console.log('='.repeat(65));
  console.log('       DVLA NSS PORTAL - ADMIN ACCOUNT CREATOR');
  console.log('='.repeat(65));

  const { conn, config } = await getConnection();
  console.log(` Connected to MySQL at ${config.host}:${config.port} (database: ${config.database})`);

  try {
    for (let i = 0; i < adminAccounts.length; i++) {
      const admin = adminAccounts[i];
      console.log(`\n Processing Admin Account #${i + 1}: ${admin.email}`);

      // Hash password using bcrypt salt 10 (matching Next.js lib/auth.ts)
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(admin.password, salt);

      // Check if user already exists
      const [existing] = await conn.query(
        'SELECT id, email, role, full_name FROM users WHERE LOWER(email) = LOWER(?)',
        [admin.email]
      );

      if (existing.length > 0) {
        const user = existing[0];
        console.log(`ℹ️ User already exists (ID: ${user.id}). Updating to admin role and setting password...`);
        await conn.query(
          `UPDATE users 
           SET role = 'admin', 
               password_hash = ?, 
               full_name = ?, 
               updated_at = NOW() 
           WHERE id = ?`,
          [passwordHash, admin.fullName, user.id]
        );
        console.log(` Account updated successfully as administrator!`);
      } else {
        console.log(`✨ Creating new administrator user...`);
        const [result] = await conn.query(
          `INSERT INTO users (email, password_hash, role, full_name, created_at, updated_at) 
           VALUES (?, ?, 'admin', ?, NOW(), NOW())`,
          [admin.email, passwordHash, admin.fullName]
        );
        console.log(` Created admin account with ID: ${result.insertId}!`);
      }
    }

    console.log('\n' + '='.repeat(65));
    console.log('            ADMIN CREDENTIALS CREATED SUCCESSFULLY');
    console.log('='.repeat(65));
    console.log(`
  [ADMIN ACCOUNT 1]
  • Name:     ${adminAccounts[0].fullName}
  • Email:    ${adminAccounts[0].email}
  • Password: ${adminAccounts[0].password}
  • Role:     admin

  [ADMIN ACCOUNT 2]
  • Name:     ${adminAccounts[1].fullName}
  • Email:    ${adminAccounts[1].email}
  • Password: ${adminAccounts[1].password}
  • Role:     admin

  Login Portal: http://localhost:5000/login
    `);
    console.log('='.repeat(65));
  } finally {
    await conn.end();
  }
}

addAdminAccounts().catch((err) => {
  console.error('\n❌ Error creating admin accounts:', err.message);
  process.exit(1);
});
