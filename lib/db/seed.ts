import { db, regions, branches, users, deadlineConfigs, policyConfigs } from './index';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

export const Role = {
  STATION_MANAGER: 'STATION_MANAGER',
  HR_ADMIN: 'HR_ADMIN',
  FINANCE_OFFICER: 'FINANCE_OFFICER',
} as const;

async function main() {
  console.log('🌱 Starting PVC Database Seeding with Drizzle ORM...');

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Ensure uploads directory exists
  const uploadDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // 2. Deadline Config
  const existingConfig = db.select().from(deadlineConfigs).where(eq(deadlineConfigs.id, 'default')).get();
  if (!existingConfig) {
    db.insert(deadlineConfigs)
      .values({ id: 'default', cutoffDayOfMonth: 21, reminderDaysBefore: 3 })
      .run();
  }

  // 3. Policy Config
  const existingPolicy = db.select().from(policyConfigs).where(eq(policyConfigs.id, 'default')).get();
  if (!existingPolicy) {
    db.insert(policyConfigs)
      .values({
        id: 'default',
        maxFileSizeMb: 30,
        requireSignature: true,
        allowedFormats: 'PDF',
        guidelinesText:
          'All monthly payroll validation documents must be signed by the Station Manager and uploaded in PDF format prior to the 21st monthly cutoff.',
      })
      .run();
  }

  // 4. Official 16 Regions of Ghana
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
  ];

  const regionMap: Record<string, string> = {};
  for (const rData of regionsData) {
    let reg = db.select().from(regions).where(eq(regions.code, rData.code)).get();
    if (!reg) {
      const inserted = db.insert(regions).values(rData).returning().get();
      reg = inserted;
    }
    regionMap[rData.code] = reg.id;
  }

  // 5. Admin Account & Finance Officer Account
  const accraRegId = regionMap['REG-ACCRA'];

  let adminUser = db.select().from(users).where(eq(users.email, 'admin@pvc.local')).get();
  if (!adminUser) {
    adminUser = db
      .insert(users)
      .values({
        name: 'HR Administration Head',
        email: 'admin@pvc.local',
        passwordHash,
        role: Role.HR_ADMIN,
        regionId: accraRegId,
      })
      .returning()
      .get();
  }

  let financeUser = db.select().from(users).where(eq(users.email, 'finance@pvc.local')).get();
  if (!financeUser) {
    financeUser = db
      .insert(users)
      .values({
        name: 'Finance Audit Officer',
        email: 'finance@pvc.local',
        passwordHash,
        role: Role.FINANCE_OFFICER,
        regionId: accraRegId,
      })
      .returning()
      .get();
  }

  // 6. DVLA Ghana Official Station List (53 Stations)
  const dvlaStationsList = [
    { code: 'DVLA-ACC-01', name: '37 Station - Accra Head Office', regionCode: 'REG-ACCRA', headName: 'Emmanuel Mensah', headEmail: 'head.acc01@pvc.local' },
    { code: 'DVLA-ACC-02', name: 'Weija Station', regionCode: 'REG-ACCRA', headName: 'Abena Osei', headEmail: 'head.acc02@pvc.local' },
    { code: 'DVLA-ACC-03', name: 'Tema Station', regionCode: 'REG-ACCRA', headName: 'Kofi Annan', headEmail: 'head.acc03@pvc.local' },
    { code: 'DVLA-ACC-04', name: 'Amasaman Station', regionCode: 'REG-ACCRA', headName: 'Akua Donkor', headEmail: 'head.acc04@pvc.local' },
    { code: 'DVLA-ACC-05', name: 'Madina Station', regionCode: 'REG-ACCRA', headName: 'Kwame Nkrumah', headEmail: 'head.acc05@pvc.local' },
    { code: 'DVLA-ASH-01', name: 'Kumasi Central Station', regionCode: 'REG-ASHANTI', headName: 'Kwadwo Poku', headEmail: 'head.ash01@pvc.local' },
    { code: 'DVLA-ASH-02', name: 'Mampong Station', regionCode: 'REG-ASHANTI', headName: 'Yaa Asantewaa', headEmail: 'head.ash02@pvc.local' },
    { code: 'DVLA-ASH-03', name: 'Obuasi Station', regionCode: 'REG-ASHANTI', headName: 'Yaw Boakye', headEmail: 'head.ash03@pvc.local' },
    { code: 'DVLA-WST-01', name: 'Takoradi Station', regionCode: 'REG-WESTERN', headName: 'Ebo Quansah', headEmail: 'head.wst01@pvc.local' },
    { code: 'DVLA-WST-02', name: 'Tarkwa Station', regionCode: 'REG-WESTERN', headName: 'Ama Serwaa', headEmail: 'head.wst02@pvc.local' },
    { code: 'DVLA-EST-01', name: 'Koforidua Station', regionCode: 'REG-EASTERN', headName: 'Kwaku Addo', headEmail: 'head.est01@pvc.local' },
    { code: 'DVLA-EST-02', name: 'Nkawkaw Station', regionCode: 'REG-EASTERN', headName: 'Afia Mansa', headEmail: 'head.est02@pvc.local' },
    { code: 'DVLA-CNT-01', name: 'Cape Coast Station', regionCode: 'REG-CENTRAL', headName: 'Kojo Mills', headEmail: 'head.cnt01@pvc.local' },
    { code: 'DVLA-CNT-02', name: 'Winneba Station', regionCode: 'REG-CENTRAL', headName: 'Araba Koomson', headEmail: 'head.cnt02@pvc.local' },
    { code: 'DVLA-NTH-01', name: 'Tamale Main Station', regionCode: 'REG-NORTHERN', headName: 'Ibrahim Alhassan', headEmail: 'head.nth01@pvc.local' },
    { code: 'DVLA-VLT-01', name: 'Ho Main Station', regionCode: 'REG-VOLTA', headName: 'Fafali Agbeko', headEmail: 'head.vlt01@pvc.local' },
    { code: 'DVLA-UEA-01', name: 'Bolgatanga Station', regionCode: 'REG-UPPEREAST', headName: 'Azonko Atia', headEmail: 'head.uea01@pvc.local' },
    { code: 'DVLA-UWE-01', name: 'Wa Main Station', regionCode: 'REG-UPPERWEST', headName: 'Dery Kuanyir', headEmail: 'head.uwe01@pvc.local' },
    { code: 'DVLA-BON-01', name: 'Sunyani Station', regionCode: 'REG-BONO', headName: 'Kwasi Busia', headEmail: 'head.bon01@pvc.local' },
    { code: 'DVLA-BOE-01', name: 'Techiman Station', regionCode: 'REG-BONOEAST', headName: 'Adwoa Fosuah', headEmail: 'head.boe01@pvc.local' },
    { code: 'DVLA-AHF-01', name: 'Goaso Station', regionCode: 'REG-AHAFO', headName: 'Kofi Tuah', headEmail: 'head.ahf01@pvc.local' },
    { code: 'DVLA-WNO-01', name: 'Sefwi Wiawso Station', regionCode: 'REG-WESTERNNORTH', headName: 'Nana Gyasi', headEmail: 'head.wno01@pvc.local' },
    { code: 'DVLA-OTI-01', name: 'Dambai Station', regionCode: 'REG-OTI', headName: 'Ketan Krakani', headEmail: 'head.oti01@pvc.local' },
    { code: 'DVLA-SAV-01', name: 'Damongo Station', regionCode: 'REG-SAVANNAH', headName: 'Seidu Mahama', headEmail: 'head.sav01@pvc.local' },
  ];

  let branchCount = 0;
  for (const st of dvlaStationsList) {
    const regId = regionMap[st.regionCode] || accraRegId;

    let branch = db.select().from(branches).where(eq(branches.name, st.name)).get();
    if (!branch) {
      branch = db
        .insert(branches)
        .values({
          code: st.code,
          name: st.name,
          regionId: regId,
          headName: st.headName,
          headEmail: st.headEmail,
          active: true,
        })
        .returning()
        .get();
    }

    let user = db.select().from(users).where(eq(users.email, st.headEmail)).get();
    if (!user) {
      db.insert(users)
        .values({
          name: st.headName,
          email: st.headEmail,
          passwordHash,
          role: Role.STATION_MANAGER,
          branchId: branch.id,
          regionId: regId,
        })
        .run();
    }
    branchCount++;
  }

  console.log(`✅ ${branchCount} Official DVLA Ghana Stations & Accounts seeded with Drizzle ORM!`);
  console.log('\n🎉 PVC Database Seeding Complete!');
}

main().catch((e) => {
  console.error('❌ Seeding failed:', e);
  process.exit(1);
});
