import { db, regions, branches, users, deadlineConfigs, policyConfigs } from './index';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

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
  const existingConfig = (await db.select().from(deadlineConfigs).where(eq(deadlineConfigs.id, 'default')))[0];
  if (!existingConfig) {
    await db.insert(deadlineConfigs)
      .values({ id: 'default', cutoffDayOfMonth: 21, reminderDaysBefore: 3 });
  }

  // 3. Policy Config
  const existingPolicy = (await db.select().from(policyConfigs).where(eq(policyConfigs.id, 'default')))[0];
  if (!existingPolicy) {
    await db.insert(policyConfigs)
      .values({
        id: 'default',
        maxFileSizeMb: 30,
        requireSignature: true,
        allowedFormats: 'PDF',
        guidelinesText:
          'All monthly payroll validation documents must be signed by the Station Manager and uploaded in PDF format prior to the 21st monthly cutoff.',
      });
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
    { name: 'North East Region', code: 'REG-NORTHEAST' },
  ];

  const regionMap: Record<string, string> = {};
  for (const rData of regionsData) {
    const existingReg = (await db.select().from(regions).where(eq(regions.code, rData.code)))[0];
    if (existingReg) {
      regionMap[rData.code] = existingReg.id;
    } else {
      const regId = crypto.randomUUID();
      await db.insert(regions).values({ id: regId, ...rData });
      regionMap[rData.code] = regId;
    }
  }

  // 5. Admin Account & Finance Officer Account
  const accraRegId = regionMap['REG-ACCRA'];

  const existingAdmin = (await db.select().from(users).where(eq(users.email, 'admin@pvc.local')))[0];
  if (!existingAdmin) {
    await db.insert(users).values({
      id: crypto.randomUUID(),
      name: 'HR Administration Head',
      email: 'admin@pvc.local',
      passwordHash,
      role: Role.HR_ADMIN,
      regionId: accraRegId,
    });
  }

  const existingFinance = (await db.select().from(users).where(eq(users.email, 'finance@pvc.local')))[0];
  if (!existingFinance) {
    await db.insert(users).values({
      id: crypto.randomUUID(),
      name: 'Finance Audit Officer',
      email: 'finance@pvc.local',
      passwordHash,
      role: Role.FINANCE_OFFICER,
      regionId: accraRegId,
    });
  }

  // 6. Official DVLA Stations (66 Stations from staff-management)
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

  let branchCount = 0;
  for (const st of dvlaStationsList) {
    const regId = regionMap[st.regionCode] || accraRegId;

    const existingBranch = (await db.select().from(branches).where(eq(branches.name, st.name)))[0];
    let branchId = existingBranch?.id;
    if (!branchId) {
      branchId = crypto.randomUUID();
      await db.insert(branches).values({
        id: branchId,
        code: st.code,
        name: st.name,
        regionId: regId,
        headName: st.headName,
        headEmail: st.headEmail,
        active: true,
      });
    }

    const existingUser = (await db.select().from(users).where(eq(users.email, st.headEmail)))[0];
    if (!existingUser) {
      await db.insert(users).values({
        id: crypto.randomUUID(),
        name: st.headName,
        email: st.headEmail,
        passwordHash,
        role: Role.STATION_MANAGER,
        branchId: branchId,
        regionId: regId,
      });
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
