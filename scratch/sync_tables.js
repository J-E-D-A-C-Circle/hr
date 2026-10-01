import pool from '../lib/db';

async function syncTables() {
  try {
    console.log('Ensuring all schema tables exist in MySQL database...');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NULL,
          user_name VARCHAR(255) DEFAULT 'System',
          action VARCHAR(100) NOT NULL,
          entity_type VARCHAR(50) DEFAULT 'application',
          entity_id INT NULL,
          details TEXT NULL,
          ip_address VARCHAR(45) NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
          INDEX idx_action (action),
          INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS verification_tokens (
          id INT AUTO_INCREMENT PRIMARY KEY,
          phone_number VARCHAR(255) NOT NULL,
          token VARCHAR(10) NOT NULL,
          expires_at DATETIME NOT NULL,
          is_used BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_phone_number (phone_number),
          INDEX idx_token (token)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    const [tables] = await pool.query('SHOW TABLES');
    console.log('✅ All database tables exist now:', tables);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error syncing database tables:', err);
    process.exit(1);
  }
}

syncTables();
