import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

export const Role = {
  STATION_MANAGER: 'STATION_MANAGER',
  HR_ADMIN: 'HR_ADMIN',
} as const;

export const SubmissionStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;

function generateSamplePDFContent(branchName: string, month: number, year: number): Buffer {
  const textContent = `%PDF-1.4
1 0 obj <</Type /Catalog /Pages 2 0 R>> endobj
2 0 obj <</Type /Pages /Kids [3 0 R] /Count 1>> endobj
3 0 obj <</Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources <</Font <</F1 5 0 R>>>>>> endobj
4 0 obj <</Length 220>> stream
BT
/F1 18 Tf
50 720 Td
(PAYROLL VALIDATION DOCUMENT - ${branchName.toUpperCase()}) Tj
/F1 12 Tf
0 -30 Td
(Period: ${month}/${year} | Status: Official DVLA Ghana Validation Scan) Tj
0 -25 Td
(Branch Head Certification: I hereby verify that all station payroll records) Tj
0 -18 Td
(and attendance log sheets for this billing cycle are accurate and complete.) Tj
0 -30 Td
(Authorized Signature: _______________________ Date: ${year}-${String(month).padStart(2, '0')}-15) Tj
ET
endstream endobj
5 0 obj <</Type /Font /Subtype /Type1 /BaseFont /Helvetica>> endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000515 00000 n 
trailer <</Size 6 /Root 1 0 R>>
startxref
594
%%EOF`;
  return Buffer.from(textContent, 'utf-8');
}

async function main() {
  console.log('🌱 Starting PVC Database Seeding with Official DVLA Ghana Stations...');

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Uploads dir
  const uploadDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // 2. Deadline Config
  await prisma.deadlineConfig.upsert({
    where: { id: 'default' },
    update: { cutoffDayOfMonth: 21, reminderDaysBefore: 3 },
    create: { id: 'default', cutoffDayOfMonth: 21, reminderDaysBefore: 3 },
  });
  console.log('✅ Deadline config initialized (Cutoff: 21st)');

  // Clean up existing data to ensure clean DVLA structure
  console.log('🧹 Cleaning old mock records...');
  await prisma.auditLog.deleteMany({});
  await prisma.submission.deleteMany({});
  await prisma.user.deleteMany({ where: { role: Role.STATION_MANAGER } });
  await prisma.branch.deleteMany({});
  await prisma.region.deleteMany({});

  // 3. Official 16 Regions of Ghana
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

  const regions: Record<string, string> = {};
  for (const r of regionsData) {
    const reg = await prisma.region.upsert({
      where: { code: r.code },
      update: { name: r.name },
      create: { name: r.name, code: r.code },
    });
    regions[r.code] = reg.id;
  }
  console.log('✅ 16 Ghana Administrative Regions created');

  // 4. Core Admin Users
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@pvc.local' },
    update: { role: Role.HR_ADMIN },
    create: {
      name: 'HR Admin',
      email: 'admin@pvc.local',
      passwordHash,
      role: Role.HR_ADMIN,
    },
  });

  const reviewerUser = await prisma.user.upsert({
    where: { email: 'reviewer@pvc.local' },
    update: { role: Role.HR_ADMIN },
    create: {
      name: 'Payroll Admin (HR)',
      email: 'reviewer@pvc.local',
      passwordHash,
      role: Role.HR_ADMIN,
    },
  });

  const execUser = await prisma.user.upsert({
    where: { email: 'exec@pvc.local' },
    update: { role: Role.HR_ADMIN },
    create: {
      name: 'HR Director',
      email: 'exec@pvc.local',
      passwordHash,
      role: Role.HR_ADMIN,
    },
  });

  console.log('✅ Core Admins created (admin@pvc.local, reviewer@pvc.local, exec@pvc.local)');

  // 5. Authentic DVLA Ghana Offices & Stations Network (53 Stations across Ghana)
  const dvlaStationsList = [
    // Greater Accra
    { code: 'DVLA-ACC-01', name: 'DVLA Head Office (Cantonments 37)', regionCode: 'REG-ACCRA', headName: 'Emmanuel Arhin', headEmail: 'head.acc01@pvc.local' },
    { code: 'DVLA-ACC-02', name: 'DVLA Tema Regional Office', regionCode: 'REG-ACCRA', headName: 'Grace Ansah', headEmail: 'head.acc02@pvc.local' },
    { code: 'DVLA-ACC-03', name: 'DVLA Weija District Office', regionCode: 'REG-ACCRA', headName: 'Kofi Osei', headEmail: 'head.acc03@pvc.local' },
    { code: 'DVLA-ACC-04', name: 'DVLA Adentan District Office', regionCode: 'REG-ACCRA', headName: 'Abena Frimpong', headEmail: 'head.acc04@pvc.local' },
    { code: 'DVLA-ACC-05', name: 'DVLA Dansoman Office', regionCode: 'REG-ACCRA', headName: 'Kwaku Addo', headEmail: 'head.acc05@pvc.local' },
    { code: 'DVLA-ACC-06', name: 'DVLA Dome Ultra Centre', regionCode: 'REG-ACCRA', headName: 'Yaw Boateng', headEmail: 'head.acc06@pvc.local' },
    { code: 'DVLA-ACC-07', name: 'DVLA Prestige & Express Centre (Haatso)', regionCode: 'REG-ACCRA', headName: 'Esi Koomson', headEmail: 'head.acc07@pvc.local' },

    // Ashanti
    { code: 'DVLA-ASH-01', name: 'DVLA Kumasi Regional Office (Asokwa)', regionCode: 'REG-ASHANTI', headName: 'Kwame Mensah', headEmail: 'head.ash01@pvc.local' },
    { code: 'DVLA-ASH-02', name: 'DVLA Obuasi District Office', regionCode: 'REG-ASHANTI', headName: 'Akua Asante', headEmail: 'head.ash02@pvc.local' },
    { code: 'DVLA-ASH-03', name: 'DVLA Offinso District Office', regionCode: 'REG-ASHANTI', headName: 'Kwadwo Appiah', headEmail: 'head.ash03@pvc.local' },
    { code: 'DVLA-ASH-04', name: 'DVLA Bekwai District Office', regionCode: 'REG-ASHANTI', headName: 'Yaa Konadu', headEmail: 'head.ash04@pvc.local' },
    { code: 'DVLA-ASH-05', name: 'DVLA Mampong District Office', regionCode: 'REG-ASHANTI', headName: 'Kofi Owusu', headEmail: 'head.ash05@pvc.local' },
    { code: 'DVLA-ASH-06', name: 'DVLA Effiduase District Office', regionCode: 'REG-ASHANTI', headName: 'Ama Serwaa', headEmail: 'head.ash06@pvc.local' },
    { code: 'DVLA-ASH-07', name: 'DVLA Kumawu District Office', regionCode: 'REG-ASHANTI', headName: 'Kwabena Agyemang', headEmail: 'head.ash07@pvc.local' },
    { code: 'DVLA-ASH-08', name: 'DVLA Ejisu Bonwire Office', regionCode: 'REG-ASHANTI', headName: 'Afia Pokuaa', headEmail: 'head.ash08@pvc.local' },

    // Western
    { code: 'DVLA-WST-01', name: 'DVLA Takoradi Regional Office', regionCode: 'REG-WESTERN', headName: 'Joseph Baidoo', headEmail: 'head.wst01@pvc.local' },
    { code: 'DVLA-WST-02', name: 'DVLA Tarkwa District Office', regionCode: 'REG-WESTERN', headName: 'Samuel Yankey', headEmail: 'head.wst02@pvc.local' },
    { code: 'DVLA-WST-03', name: 'DVLA Axim District Office', regionCode: 'REG-WESTERN', headName: 'Francis Cudjoe', headEmail: 'head.wst03@pvc.local' },

    // Eastern
    { code: 'DVLA-EST-01', name: 'DVLA Koforidua Regional Office', regionCode: 'REG-EASTERN', headName: 'Daniel Asare', headEmail: 'head.est01@pvc.local' },
    { code: 'DVLA-EST-02', name: 'DVLA Nkawkaw District Office', regionCode: 'REG-EASTERN', headName: 'Peter Ofori', headEmail: 'head.est02@pvc.local' },
    { code: 'DVLA-EST-03', name: 'DVLA Akim Oda District Office', regionCode: 'REG-EASTERN', headName: 'Comfort Ampofo', headEmail: 'head.est03@pvc.local' },
    { code: 'DVLA-EST-04', name: 'DVLA Akwatia District Office', regionCode: 'REG-EASTERN', headName: 'Charles Darko', headEmail: 'head.est04@pvc.local' },
    { code: 'DVLA-EST-05', name: 'DVLA Asamankese District Office', regionCode: 'REG-EASTERN', headName: 'Mercy Botwe', headEmail: 'head.est05@pvc.local' },
    { code: 'DVLA-EST-06', name: 'DVLA Abuakwa District Office', regionCode: 'REG-EASTERN', headName: 'Isaac Gyasi', headEmail: 'head.est06@pvc.local' },

    // Central
    { code: 'DVLA-CEN-01', name: 'DVLA Cape Coast Regional Office', regionCode: 'REG-CENTRAL', headName: 'Kweku Arthur', headEmail: 'head.cen01@pvc.local' },
    { code: 'DVLA-CEN-02', name: 'DVLA Winneba District Office', regionCode: 'REG-CENTRAL', headName: 'Kojo Pratt', headEmail: 'head.cen02@pvc.local' },
    { code: 'DVLA-CEN-03', name: 'DVLA Agona Swedru District Office', regionCode: 'REG-CENTRAL', headName: 'Araba Ghartey', headEmail: 'head.cen03@pvc.local' },
    { code: 'DVLA-CEN-04', name: 'DVLA Mankessim Satellite Office', regionCode: 'REG-CENTRAL', headName: 'Ato Hammond', headEmail: 'head.cen04@pvc.local' },
    { code: 'DVLA-CEN-05', name: 'DVLA Assin Fosu Satellite Office', regionCode: 'REG-CENTRAL', headName: 'Ekow Barnes', headEmail: 'head.cen05@pvc.local' },
    { code: 'DVLA-CEN-06', name: 'DVLA Kasoa Ultra Station', regionCode: 'REG-CENTRAL', headName: 'Efua Mensah', headEmail: 'head.cen06@pvc.local' },

    // Northern
    { code: 'DVLA-NTH-01', name: 'DVLA Tamale Regional Office', regionCode: 'REG-NORTHERN', headName: 'Mohammed Alhassan', headEmail: 'head.nth01@pvc.local' },
    { code: 'DVLA-NTH-02', name: 'DVLA Yendi District Office', regionCode: 'REG-NORTHERN', headName: 'Ibrahim Fuseini', headEmail: 'head.nth02@pvc.local' },

    // Volta
    { code: 'DVLA-VLT-01', name: 'DVLA Ho Regional Office', regionCode: 'REG-VOLTA', headName: 'Selorm Gbesemete', headEmail: 'head.vlt01@pvc.local' },
    { code: 'DVLA-VLT-02', name: 'DVLA Hohoe District Office', regionCode: 'REG-VOLTA', headName: 'Mawuli Agbefe', headEmail: 'head.vlt02@pvc.local' },
    { code: 'DVLA-VLT-03', name: 'DVLA Denu District Office', regionCode: 'REG-VOLTA', headName: 'Fafa Tsikata', headEmail: 'head.vlt03@pvc.local' },
    { code: 'DVLA-VLT-04', name: 'DVLA Akatsi District Office', regionCode: 'REG-VOLTA', headName: 'Kofi Dogbe', headEmail: 'head.vlt04@pvc.local' },

    // Upper East
    { code: 'DVLA-UEA-01', name: 'DVLA Bolgatanga Regional Office', regionCode: 'REG-UPPEREAST', headName: 'Atanga Ayine', headEmail: 'head.uea01@pvc.local' },
    { code: 'DVLA-UEA-02', name: 'DVLA Navrongo District Office', regionCode: 'REG-UPPEREAST', headName: 'Akwasi Addai', headEmail: 'head.uea02@pvc.local' },

    // Upper West
    { code: 'DVLA-UWE-01', name: 'DVLA Wa Regional Office', regionCode: 'REG-UPPERWEST', headName: 'Naa Deri', headEmail: 'head.uwe01@pvc.local' },
    { code: 'DVLA-UWE-02', name: 'DVLA Jirapa District Office', regionCode: 'REG-UPPERWEST', headName: 'Bawa Saaka', headEmail: 'head.uwe02@pvc.local' },

    // Bono
    { code: 'DVLA-BNO-01', name: 'DVLA Sunyani Regional Office', regionCode: 'REG-BONO', headName: 'Nana Kyeremeh', headEmail: 'head.bno01@pvc.local' },
    { code: 'DVLA-BNO-02', name: 'DVLA Dormaa Ahenkro District Office', regionCode: 'REG-BONO', headName: 'Kwasi Oppong', headEmail: 'head.bno02@pvc.local' },
    { code: 'DVLA-BNO-03', name: 'DVLA Berekum District Office', regionCode: 'REG-BONO', headName: 'Akosua Yeboah', headEmail: 'head.bno03@pvc.local' },

    // Bono East
    { code: 'DVLA-BNE-01', name: 'DVLA Techiman Regional Office', regionCode: 'REG-BONOEAST', headName: 'Adjei Baah', headEmail: 'head.bne01@pvc.local' },
    { code: 'DVLA-BNE-02', name: 'DVLA Nkoranza District Office', regionCode: 'REG-BONOEAST', headName: 'Abena Takyiwaa', headEmail: 'head.bne02@pvc.local' },

    // Ahafo
    { code: 'DVLA-AHF-01', name: 'DVLA Goaso Regional Office', regionCode: 'REG-AHAFO', headName: 'Yaw Acheampong', headEmail: 'head.ahf01@pvc.local' },
    { code: 'DVLA-AHF-02', name: 'DVLA Bechem District Office', regionCode: 'REG-AHAFO', headName: 'Kwaku Duah', headEmail: 'head.ahf02@pvc.local' },

    // Western North
    { code: 'DVLA-WNO-01', name: 'DVLA Sefwi Wiawso Regional Office', regionCode: 'REG-WESTERNNORTH', headName: 'Kofi Nsubuga', headEmail: 'head.wno01@pvc.local' },
    { code: 'DVLA-WNO-02', name: 'DVLA Enchi District Office', regionCode: 'REG-WESTERNNORTH', headName: 'Kwame Gyimah', headEmail: 'head.wno02@pvc.local' },

    // Oti
    { code: 'DVLA-OTI-01', name: 'DVLA Dambai Regional Office', regionCode: 'REG-OTI', headName: 'Komi Akakpo', headEmail: 'head.oti01@pvc.local' },
    { code: 'DVLA-OTI-02', name: 'DVLA Nkwanta District Office', regionCode: 'REG-OTI', headName: 'Ablavi Mensah', headEmail: 'head.oti02@pvc.local' },

    // Savannah
    { code: 'DVLA-SAV-01', name: 'DVLA Damongo Regional Office', regionCode: 'REG-SAVANNAH', headName: 'Yakubu Seidu', headEmail: 'head.sav01@pvc.local' },
    { code: 'DVLA-SAV-02', name: 'DVLA Bole District Office', regionCode: 'REG-SAVANNAH', headName: 'Haruna Mahama', headEmail: 'head.sav02@pvc.local' },

    // North East
    { code: 'DVLA-NER-01', name: 'DVLA Nalerigu Regional Office', regionCode: 'REG-NORTHEAST', headName: 'Sulemana Tanko', headEmail: 'head.ner01@pvc.local' },
    { code: 'DVLA-NER-02', name: 'DVLA Walewale District Office', regionCode: 'REG-NORTHEAST', headName: 'Issahaku Zakaria', headEmail: 'head.ner02@pvc.local' },
  ];

  const branches = [];
  const branchUsers = [];

  for (const st of dvlaStationsList) {
    const regId = regions[st.regionCode];

    const branch = await prisma.branch.upsert({
      where: { name: st.name },
      update: { code: st.code, regionId: regId, headName: st.headName, headEmail: st.headEmail },
      create: {
        code: st.code,
        name: st.name,
        regionId: regId,
        headName: st.headName,
        headEmail: st.headEmail,
        active: true,
      },
    });
    branches.push(branch);

    const user = await prisma.user.upsert({
      where: { email: st.headEmail },
      update: { branchId: branch.id, role: Role.STATION_MANAGER },
      create: {
        name: st.headName,
        email: st.headEmail,
        passwordHash,
        role: Role.STATION_MANAGER,
        branchId: branch.id,
      },
    });
    branchUsers.push(user);
  }

  console.log(`✅ ${branches.length} Official DVLA Ghana Stations & Station Manager Accounts created!`);

  // 6. Submissions for 2026 (Months 1 to 8)
  const currentYear = 2026;
  const currentMonth = 8;
  let submissionCount = 0;

  for (let bIdx = 0; bIdx < branches.length; bIdx++) {
    const branch = branches[bIdx];
    const headUser = branchUsers[bIdx];

    // Months 1 to 7 (Jan to July)
    for (let m = 1; m < currentMonth; m++) {
      const isApproved = (bIdx + m) % 12 !== 0;
      const fileName = `payroll_${branch.code}_${currentYear}_${String(m).padStart(2, '0')}.pdf`;
      const relativePath = `uploads/${fileName}`;
      const fullPath = path.join(uploadDir, fileName);

      fs.writeFileSync(fullPath, generateSamplePDFContent(branch.name, m, currentYear));

      await prisma.submission.create({
        data: {
          branchId: branch.id,
          month: m,
          year: currentYear,
          fileName,
          filePath: relativePath,
          fileSize: 1024 * 145,
          note: `Monthly validation scan for ${branch.name} (${m}/${currentYear})`,
          uploadedById: headUser.id,
          uploadedAt: new Date(currentYear, m - 1, Math.min(18 + (bIdx % 4), 21)),
          status: isApproved ? SubmissionStatus.APPROVED : SubmissionStatus.PENDING,
          reviewerId: isApproved ? reviewerUser.id : null,
          reviewerNotes: isApproved ? 'Verified and approved by HR Payroll.' : null,
          reviewedAt: isApproved ? new Date(currentYear, m - 1, 22) : null,
          ocrPassed: true,
          ocrText: `PAYROLL VALIDATION DOCUMENT - ${branch.name}. Verified attendance & salary records.`,
        },
      });
      submissionCount++;
    }

    // Month 8 (August 2026)
    if (bIdx < 25) {
      const fileName = `payroll_${branch.code}_${currentYear}_08.pdf`;
      const relativePath = `uploads/${fileName}`;
      fs.writeFileSync(path.join(uploadDir, fileName), generateSamplePDFContent(branch.name, 8, currentYear));

      await prisma.submission.create({
        data: {
          branchId: branch.id,
          month: 8,
          year: currentYear,
          fileName,
          filePath: relativePath,
          fileSize: 1024 * 160,
          note: 'Submitted on time for August payroll review.',
          uploadedById: headUser.id,
          uploadedAt: new Date(2026, 7, 18),
          status: SubmissionStatus.APPROVED,
          reviewerId: reviewerUser.id,
          reviewerNotes: 'Approved. All signatures verified.',
          reviewedAt: new Date(2026, 7, 20),
          ocrPassed: true,
        },
      });
      submissionCount++;
    } else if (bIdx < 42) {
      const fileName = `payroll_${branch.code}_${currentYear}_08.pdf`;
      const relativePath = `uploads/${fileName}`;
      fs.writeFileSync(path.join(uploadDir, fileName), generateSamplePDFContent(branch.name, 8, currentYear));

      await prisma.submission.create({
        data: {
          branchId: branch.id,
          month: 8,
          year: currentYear,
          fileName,
          filePath: relativePath,
          fileSize: 1024 * 152,
          note: 'August payroll validation attached. Awaiting HR review.',
          uploadedById: headUser.id,
          uploadedAt: new Date(2026, 7, 21),
          status: SubmissionStatus.PENDING,
          ocrPassed: true,
        },
      });
      submissionCount++;
    } else if (bIdx < 48) {
      const fileName = `payroll_${branch.code}_${currentYear}_08.pdf`;
      const relativePath = `uploads/${fileName}`;
      fs.writeFileSync(path.join(uploadDir, fileName), generateSamplePDFContent(branch.name, 8, currentYear));

      await prisma.submission.create({
        data: {
          branchId: branch.id,
          month: 8,
          year: currentYear,
          fileName,
          filePath: relativePath,
          fileSize: 1024 * 90,
          note: 'August scan',
          uploadedById: headUser.id,
          uploadedAt: new Date(2026, 7, 21),
          status: SubmissionStatus.REJECTED,
          reviewerId: reviewerUser.id,
          reviewerNotes: 'Page 3 signature line is cut off and blurry. Please re-scan clearly and upload again.',
          reviewedAt: new Date(2026, 7, 22),
          ocrPassed: false,
        },
      });
      submissionCount++;
    }
  }

  console.log(`✅ ${submissionCount} Submissions seeded for 2026 across DVLA Stations!`);

  // 7. Seed Initial Audit Logs
  await prisma.auditLog.createMany({
    data: [
      {
        actorId: adminUser.id,
        action: 'SYSTEM_INIT',
        targetType: 'SYSTEM',
        metadata: JSON.stringify({ message: `PVC Platform Initialized with ${branches.length} DVLA Ghana Stations` }),
      },
      {
        actorId: reviewerUser.id,
        action: 'BULK_APPROVE',
        targetType: 'SUBMISSION',
        metadata: JSON.stringify({ month: 7, year: 2026, approvedCount: 48 }),
      },
    ],
  });

  console.log('✅ Audit logs seeded');
  console.log('\n🎉 PVC Database Seeding Complete with DVLA Ghana Offices network!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
