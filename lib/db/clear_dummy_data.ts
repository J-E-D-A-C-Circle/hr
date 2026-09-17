import { db, submissions, auditLogs, users, branches, deadlineConfigs } from './index';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

async function main() {
  console.log('🧹 Clearing all dummy data for production readiness with Drizzle ORM...');

  // 1. Clear upload files
  const uploadDir = path.join(process.cwd(), 'uploads');
  if (fs.existsSync(uploadDir)) {
    const files = fs.readdirSync(uploadDir);
    let deletedFiles = 0;
    for (const file of files) {
      if (file !== '.gitkeep') {
        try {
          fs.unlinkSync(path.join(uploadDir, file));
          deletedFiles++;
        } catch (e) {
          console.warn(`Could not delete file ${file}:`, e);
        }
      }
    }
    console.log(`✅ Uploads directory cleaned (${deletedFiles} files removed)`);
  }

  // 2. Clear Database Records
  db.delete(submissions).run();
  console.log('✅ Deleted all submission records');

  db.delete(auditLogs).run();
  console.log('✅ Deleted all audit log entries');

  db.delete(users).where(eq(users.role, 'STATION_MANAGER')).run();
  console.log('✅ Deleted dummy station manager accounts');

  db.delete(branches).run();
  console.log('✅ Deleted dummy branch stations');

  // Ensure default HR Admin account exists
  const passwordHash = await bcrypt.hash('password123', 10);
  const existingAdmin = db.select().from(users).where(eq(users.email, 'admin@pvc.local')).get();
  if (!existingAdmin) {
    db.insert(users)
      .values({
        name: 'HR Admin',
        email: 'admin@pvc.local',
        passwordHash,
        role: 'HR_ADMIN',
      })
      .run();
  }

  // Ensure default Deadline config exists
  const existingDeadline = db.select().from(deadlineConfigs).where(eq(deadlineConfigs.id, 'default')).get();
  if (!existingDeadline) {
    db.insert(deadlineConfigs)
      .values({ id: 'default', cutoffDayOfMonth: 21, reminderDaysBefore: 3 })
      .run();
  }

  console.log('✨ Database successfully cleared! Clean state ready for real data entry.');
}

main().catch((e) => {
  console.error('Error clearing dummy data:', e);
  process.exit(1);
});
