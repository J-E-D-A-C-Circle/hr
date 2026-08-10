import { PrismaClient, PositionType, PositionStatus, ApplicationStage, UserRole, ApplicationDocumentType } from '@prisma/client';
import bcrypt from 'bcryptjs';


const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting DRAP Database Seeding ---');

  // 1. Seed Departments
  const deptIT = await prisma.department.upsert({
    where: { code: 'IT' },
    update: {},
    create: {
      name: 'Information Technology',
      code: 'IT',
      description: 'Manages systems, digital licensing portals, and ICT infrastructure.',
    },
  });

  const deptVIT = await prisma.department.upsert({
    where: { code: 'VIT' },
    update: {},
    create: {
      name: 'Vehicle Inspection & Testing',
      code: 'VIT',
      description: 'Oversees motor vehicle safety standards, roadworthiness tests, and technical inspections.',
    },
  });

  const deptDTL = await prisma.department.upsert({
    where: { code: 'DTL' },
    update: {},
    create: {
      name: 'Driver Testing & Licensing',
      code: 'DTL',
      description: 'Handles driver examination, biometric capture, and driver license issuance.',
    },
  });

  const deptHR = await prisma.department.upsert({
    where: { code: 'HR' },
    update: {},
    create: {
      name: 'Human Resources',
      code: 'HR',
      description: 'Manages staff recruitment, training, performance, and attachment placements.',
    },
  });

  const deptFIN = await prisma.department.upsert({
    where: { code: 'FIN' },
    update: {},
    create: {
      name: 'Finance & Accounts',
      code: 'FIN',
      description: 'Handles revenue collection, budgeting, and financial auditing.',
    },
  });

  console.log('✓ Departments created');

  // 2. Seed Stations
  const stationHQ = await prisma.station.upsert({
    where: { name: 'Headquarters (Accra 37)' },
    update: {},
    create: { name: 'Headquarters (Accra 37)', location: 'Accra, Greater Accra' },
  });

  const stationTema = await prisma.station.upsert({
    where: { name: 'Tema Regional Office' },
    update: {},
    create: { name: 'Tema Regional Office', location: 'Tema, Greater Accra' },
  });

  const stationKumasi = await prisma.station.upsert({
    where: { name: 'Kumasi Regional Office' },
    update: {},
    create: { name: 'Kumasi Regional Office', location: 'Kumasi, Ashanti Region' },
  });

  const stationTakoradi = await prisma.station.upsert({
    where: { name: 'Takoradi Regional Office' },
    update: {},
    create: { name: 'Takoradi Regional Office', location: 'Takoradi, Western Region' },
  });

  console.log('✓ Stations created');

  // 3. Seed Users
  const passwordHash = await bcrypt.hash('Admin@123456', 10);

  await prisma.user.upsert({
    where: { email: 'admin@dvla.gov.gh' },
    update: {},
    create: {
      email: 'admin@dvla.gov.gh',
      passwordHash,
      name: 'Chief Admin',
      role: UserRole.SUPER_ADMIN,
    },
  });

  await prisma.user.upsert({
    where: { email: 'hr@dvla.gov.gh' },
    update: {},
    create: {
      email: 'hr@dvla.gov.gh',
      passwordHash,
      name: 'HR Officer',
      role: UserRole.HR,
      departmentId: deptHR.id,
    },
  });

  await prisma.user.upsert({
    where: { email: 'it.admin@dvla.gov.gh' },
    update: {},
    create: {
      email: 'it.admin@dvla.gov.gh',
      passwordHash,
      name: 'IT Department Admin',
      role: UserRole.DEPT_ADMIN,
      departmentId: deptIT.id,
    },
  });

  console.log('✓ Users created (Default credentials: admin@dvla.gov.gh / Admin@123456)');

  // 4. Seed Positions
  const posSoftwareIntern = await prisma.position.create({
    data: {
      title: 'Software Engineering Attachment Trainee',
      type: PositionType.ATTACHMENT,
      departmentId: deptIT.id,
      description: 'Assisting the IT software development team in maintaining digital driver portal backend services and frontend applications.',
      requirements: 'Degree/Diploma student in Computer Science, Software Engineering, or related fields. Basic knowledge of JavaScript, Next.js, and SQL.',
      status: PositionStatus.OPEN,
      maxMarks: 100,
    },
  });

  const posVehicleExaminer = await prisma.position.create({
    data: {
      title: 'Vehicle Inspection Attachment Trainee',
      type: PositionType.ATTACHMENT,
      departmentId: deptVIT.id,
      description: 'Attachment opportunity for automotive engineering students to gain practical experience in automated vehicle safety testing.',
      requirements: 'HND/Degree in Automotive Engineering or Mechanical Engineering.',
      status: PositionStatus.OPEN,
      maxMarks: 100,
    },
  });

  const posDataEntry = await prisma.position.create({
    data: {
      title: 'Temporary Data Entry Officer',
      type: PositionType.TEMPORARY,
      departmentId: deptDTL.id,
      description: 'Temporary role for digitizing driver licensing archives and processing biometric capture queues.',
      requirements: 'WASSCE or Diploma. Excellent typing speed and attention to detail.',
      status: PositionStatus.OPEN,
      maxMarks: 100,
    },
  });

  await prisma.position.create({
    data: {
      title: 'Temporary Finance & Revenue Officer',
      type: PositionType.TEMPORARY,
      departmentId: deptFIN.id,
      description: 'Temporary support role to assist with revenue collection, reconciliation, and financial reporting at DVLA stations.',
      requirements: 'HND or Degree in Accounting, Finance, or Business Administration.',
      status: PositionStatus.OPEN,
      maxMarks: 100,
    },
  });

  await prisma.position.create({
    data: {
      title: 'Human Resource Officer (Permanent)',
      type: PositionType.PERMANENT,
      departmentId: deptHR.id,
      description: 'Permanent HR professional role responsible for staff recruitment, onboarding, performance management, and employee relations at DVLA Ghana.',
      requirements: 'Degree in Human Resource Management, Business Administration, or related field. Minimum 2 years HR experience.',
      status: PositionStatus.OPEN,
      maxMarks: 100,
    },
  });

  await prisma.position.create({
    data: {
      title: 'Senior IT Systems Administrator (Permanent)',
      type: PositionType.PERMANENT,
      departmentId: deptIT.id,
      description: 'Permanent technical role overseeing DVLA network infrastructure, server management, digital licensing systems, and cybersecurity protocols.',
      requirements: 'Degree in Computer Science or IT. Minimum 3 years system administration experience. CCNA or equivalent certification preferred.',
      status: PositionStatus.OPEN,
      maxMarks: 100,
    },
  });

  await prisma.position.create({
    data: {
      title: 'Finance & Accounts Officer (Permanent)',
      type: PositionType.PERMANENT,
      departmentId: deptFIN.id,
      description: 'Permanent finance role managing DVLA revenue accounts, budget preparation, and statutory financial reporting.',
      requirements: 'Degree in Accounting or Finance. Part/full ICAG or ACCA qualification preferred.',
      status: PositionStatus.OPEN,
      maxMarks: 100,
    },
  });

  console.log('✓ Positions created');

  // 5. Seed Scoring Rubric for Software Engineering Intern
  const critTech = await prisma.rubricCriteria.create({
    data: {
      positionId: posSoftwareIntern.id,
      title: 'Technical & Practical Skills',
      description: 'Assessment of core software engineering, coding, and web development fundamentals.',
      maxMark: 50,
      order: 1,
      subcriteria: {
        create: [
          { title: 'Programming Fundamentals & Logic', description: 'JavaScript/TypeScript, algorithmic reasoning', maxMark: 25, order: 1 },
          { title: 'Database & SQL Architecture', description: 'Understanding of database schema and query design', maxMark: 25, order: 2 },
        ],
      },
    },
  });

  const critSoft = await prisma.rubricCriteria.create({
    data: {
      positionId: posSoftwareIntern.id,
      title: 'Communication & Professionalism',
      description: 'Evaluation of team interaction, clarity of thought, and verbal communication.',
      maxMark: 30,
      order: 2,
      subcriteria: {
        create: [
          { title: 'Verbal Expression & Clarity', description: 'Articulating technical concepts clearly', maxMark: 15, order: 1 },
          { title: 'Collaboration & Teamwork Mindset', description: 'Work ethic and adaptability', maxMark: 15, order: 2 },
        ],
      },
    },
  });

  const critAptitude = await prisma.rubricCriteria.create({
    data: {
      positionId: posSoftwareIntern.id,
      title: 'Problem Solving & Critical Thinking',
      description: 'Capacity to troubleshoot complex issues under pressure.',
      maxMark: 20,
      order: 3,
      subcriteria: {
        create: [
          { title: 'Analytical Problem Solving', description: 'Systematic approach to debugging and solution design', maxMark: 20, order: 1 },
        ],
      },
    },
  });

  console.log('✓ Scoring Rubric created for position (Total: 50 + 30 + 20 = 100 max marks)');

  // 6. Seed Required Documents (Universal Checklist)
  await prisma.requiredDocument.deleteMany({});
  await prisma.requiredDocument.createMany({
    data: [
      {
        title: 'National Identity Card (Ghana Card)',
        description: 'Clear color copy of your official valid Ghana Card (Front & Back).',
        isFillableTemplate: false,
        isMandatory: true,
      },
      {
        title: 'Certified Educational Certificates & Transcripts',
        description: 'Copies of degree certificates, WASSCE results, or academic transcripts.',
        isFillableTemplate: false,
        isMandatory: true,
      },
      {
        title: 'DVLA Medical Fitness Assessment Form',
        description: 'Download the fillable medical form, complete it with an accredited government hospital doctor, and re-upload.',
        isFillableTemplate: true,
        templateFileUrl: '/uploads/templates/DVLA_Medical_Fitness_Form.pdf',
        isMandatory: true,
      },
      {
        title: 'Guarantor Undertaking Form',
        description: 'Download the guarantor form, obtain signatures from 2 senior civil servants or legal practitioners, and re-upload.',
        isFillableTemplate: true,
        templateFileUrl: '/uploads/templates/DVLA_Guarantor_Form.pdf',
        isMandatory: true,
      },
      {
        title: 'Police Criminal Clearance Certificate',
        description: 'Official clearance certificate issued by the Criminal Investigations Department (CID).',
        isFillableTemplate: false,
        isMandatory: true,
      },
    ],
  });

  console.log('✓ Required Document Checklist created');

  // 7. Seed Sample Applicants & Applications (Idempotent cleanup)
  await prisma.applicant.deleteMany({
    where: {
      email: { in: ['kwame.mensah@example.com', 'abena.osei@dvla.gov.gh'] },
    },
  });

  const applicant1 = await prisma.applicant.create({
    data: {
      fullName: 'Kwame Mensah',
      email: 'kwame.mensah@example.com',
      phone: '+233 24 123 4567',
      isCurrentDvlaStaff: false,
    },
  });

  const app1 = await prisma.application.create({
    data: {
      referenceNumber: 'DVLA-2026-KM92A',
      applicantId: applicant1.id,
      positionId: posSoftwareIntern.id,
      departmentId: deptIT.id,
      isCurrentDvlaStaff: false,
      currentStage: ApplicationStage.SUBMITTED,
      notes: 'Initial public application submission received.',
      documents: {
        create: [
          { type: ApplicationDocumentType.CV, fileName: 'Kwame_Mensah_CV.pdf', fileUrl: '/uploads/documents/sample_cv.pdf' },
          { type: ApplicationDocumentType.COVER_LETTER, fileName: 'Cover_Letter.pdf', fileUrl: '/uploads/documents/sample_cover.pdf' },
          { type: ApplicationDocumentType.APPLICATION_LETTER, fileName: 'Application_Letter.pdf', fileUrl: '/uploads/documents/sample_app.pdf' },
        ],
      },
      stageHistory: {
        create: [
          { toStage: ApplicationStage.SUBMITTED, notes: 'Application submitted successfully via portal.' },
        ],
      },
    },
  });

  const applicant2 = await prisma.applicant.create({
    data: {
      fullName: 'Abena Osei',
      email: 'abena.osei@dvla.gov.gh',
      phone: '+233 20 987 6543',
      isCurrentDvlaStaff: true,
      stationId: stationHQ.id,
      departmentId: deptVIT.id,
    },
  });

  const app2 = await prisma.application.create({
    data: {
      referenceNumber: 'DVLA-2026-AO48B',
      applicantId: applicant2.id,
      positionId: posVehicleExaminer.id,
      departmentId: deptVIT.id,
      isCurrentDvlaStaff: true,
      stationId: stationHQ.id,
      currentStage: ApplicationStage.APPROVED,
      appointmentLetter: {
        create: {
          verificationCode: 'DVLA-VER-2026-X9K82',
          fileUrl: '/verify/DVLA-VER-2026-X9K82',
          fileName: 'DVLA_Appointment_Letter_Abena_Osei.pdf',
          customRefNumber: 'DVLA/HR/07/26/ PLACMT/0127',
          customSubject: 'TEMPORARY PLACEMENT',
          customBodyText: 'This is to inform you that, you have been temporarily posted to the Head Office as an IT Officer, assigned to the Human Resource and Administration Department, effective Monday, August 3, 2026.\n\nYou are to report to the Ag, Director Human Resource and Ag. Director Administration, for necessary instructions and directives concerning your official duties.\n\nThank you.',
          signatoryName: 'EPHRAIM NII TAN SACKEY',
          signatoryTitle: 'AG. DIRECTOR HR',
          effectiveDate: 'Monday, August 3, 2026',
        },
      },
      documents: {
        create: [
          { type: ApplicationDocumentType.CV, fileName: 'Abena_Osei_CV.pdf', fileUrl: '/uploads/documents/sample_cv2.pdf' },
        ],
      },
      stageHistory: {
        create: [
          { toStage: ApplicationStage.SUBMITTED, notes: 'Application submitted.' },
          { toStage: ApplicationStage.UNDER_REVIEW, notes: 'Reviewed by HR.' },
          { toStage: ApplicationStage.SHORTLISTED, notes: 'Shortlisted for panel.' },
          { toStage: ApplicationStage.PANEL_SCORING, notes: 'Scored by inspection panel.' },
          { toStage: ApplicationStage.APPROVED, notes: 'Approved for attachment.' },
        ],
      },
    },
  });

  console.log('✓ Sample Applicants & Applications created');
  console.log('--- DRAP Seeding Completed Successfully ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
