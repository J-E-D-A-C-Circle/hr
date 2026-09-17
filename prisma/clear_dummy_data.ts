import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Clearing all dummy data for production readiness...');

  // 1. Clear upload files
  const uploadDir = path.join(process.cwd(), 'uploads');
  if (fs.existsSync(uploadDir)) {
    const files = fs.readdirSync(uploadDir);
    for (const file of files) {
      if (file !== '.gitkeep') {
        try {
          fs.unlinkSync(path.join(uploadDir, file));
        } catch (e) {
          console.warn(`Could not delete file ${file}:`, e);
        }
      }
    }
    console.log(`✅ Uploads directory cleaned (${files.length} files removed)`);
  }

  // 2. Clear Database Records
  const deletedSubs = await prisma.submission.deleteMany({});
  console.log(`✅ Deleted ${deletedSubs.count} dummy submission records`);

  const deletedLogs = await prisma.auditLog.deleteMany({});
  console.log(`✅ Deleted ${deletedLogs.count} audit log entries`);

  const deletedUsers = await prisma.user.deleteMany({
    where: { role: 'STATION_MANAGER' },
  });
  console.log(`✅ Deleted ${deletedUsers.count} dummy station manager accounts`);

  const deletedBranches = await prisma.branch.deleteMany({});
  console.log(`✅ Deleted ${deletedBranches.count} dummy branch stations`);

  // Ensure default HR Admin account exists
  const passwordHash = await bcrypt.hash('password123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@pvc.local' },
    update: { role: 'HR_ADMIN' },
    create: {
      name: 'HR Admin',
      email: 'admin@pvc.local',
      passwordHash,
      role: 'HR_ADMIN',
    },
  });

  // Ensure default Deadline config exists
  await prisma.deadlineConfig.upsert({
    where: { id: 'default' },
    update: { cutoffDayOfMonth: 21, reminderDaysBefore: 3 },
    create: { id: 'default', cutoffDayOfMonth: 21, reminderDaysBefore: 3 },
  });

  console.log('✨ Database successfully cleared! Clean state ready for real data entry.');
}

main()
  .catch((e) => {
    console.error('Error clearing dummy data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
