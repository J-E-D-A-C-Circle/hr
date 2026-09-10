import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.adminUser.upsert({
    where: { username: "hr.admin" },
    update: {
      passwordHash: "plain:admin123",
      status: "ACTIVE",
    },
    create: {
      username: "hr.admin",
      email: "admin@dvla.gov.gh",
      name: "Super Administrator",
      passwordHash: "plain:admin123",
      status: "ACTIVE",
    },
  });

  console.log("✅ Super Admin pre-seeded successfully in DB:", admin.username);
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
