const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {};
  for (const arg of args) {
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=');
      if (key && value !== undefined) parsed[key] = value;
    }
  }
  return parsed;
}

function getDbConfigs() {
  const env = {};
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
        env[k] = v;
      }
    }
  }

  const host = process.env.DB_HOST || env.DB_HOST || '127.0.0.1';
  const port = Number(process.env.DB_PORT || env.DB_PORT || 3307);
  const user = process.env.DB_USER || env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : (env.DB_PASSWORD !== undefined ? env.DB_PASSWORD : 'root');
  const database = process.env.DB_NAME || env.DB_NAME || 'dvla_nss_portal';

  return [
    { host, port, user, password, database },
    { host: '127.0.0.1', port: 3306, user, password, database },
    { host: '127.0.0.1', port: 3307, user: 'root', password: 'root', database },
    { host: '127.0.0.1', port: 3306, user: 'root', password: 'root', database },
  ];
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

async function resolveAdminId(conn) {
  const [rows] = await conn.query('SELECT id FROM users WHERE LOWER(email)=LOWER(?) AND role = ?', ['admin@dvla.gov.gh', 'admin']);
  if (rows.length > 0) return rows[0].id;
  const [result] = await conn.query('INSERT INTO users (email, password_hash, role, full_name, created_at, updated_at) VALUES (?, ?, "admin", ?, NOW(), NOW()) ON DUPLICATE KEY UPDATE email = email', ['admin@dvla.gov.gh', await bcrypt.hash('AdminPass@2026', await bcrypt.genSalt(10)), 'System Administrator']);
  return result.insertId || 1;
}

async function upsertApplicant(conn, applicant, adminId) {
  const passwordHash = await bcrypt.hash(applicant.password, await bcrypt.genSalt(10));

  const [existingUser] = await conn.query('SELECT id FROM users WHERE LOWER(email) = LOWER(?)', [applicant.email]);
  let userId;

  if (existingUser.length > 0) {
    userId = existingUser[0].id;
    await conn.query(
      `UPDATE users SET full_name = ?, password_hash = ?, role = 'applicant', updated_at = NOW() WHERE id = ?`,
      [applicant.fullName, passwordHash, userId]
    );
    console.log(` Updated existing applicant user: ${applicant.email}`);
  } else {
    const [result] = await conn.query(
      'INSERT INTO users (email, password_hash, role, full_name, created_at, updated_at) VALUES (?, ?, "applicant", ?, NOW(), NOW())',
      [applicant.email, passwordHash, applicant.fullName]
    );
    userId = result.insertId;
    console.log(` Created new applicant user: ${applicant.email}`);
  }

  const appData = {
    user_id: userId,
    nss_number: applicant.nssNumber,
    first_name: applicant.firstName,
    last_name: applicant.lastName,
    middle_name: applicant.middleName || null,
    date_of_birth: applicant.dateOfBirth,
    gender: applicant.gender,
    nationality: applicant.nationality,
    phone_number: applicant.phoneNumber,
    email: applicant.email,
    residential_address: applicant.residentialAddress,
    region: applicant.region,
    district: applicant.district,
    institution_name: applicant.institutionName,
    course_program: applicant.courseProgram,
    year_of_completion: applicant.yearOfCompletion,
    posting_region: applicant.postingRegion,
    posting_district: applicant.postingDistrict,
    posting_station: applicant.postingStation,
    posting_department: applicant.postingDepartment,
    service_year: applicant.serviceYear,
    service_period_start: applicant.servicePeriodStart,
    service_period_end: applicant.servicePeriodEnd,
    passport_photo: applicant.passportPhoto || null,
    id_card_copy: applicant.idCardCopy || null,
    appointment_letter: applicant.appointmentLetter || null,
    certificates: applicant.certificates || null,
    additional_info: applicant.additionalInfo ? JSON.stringify(applicant.additionalInfo) : null,
    status: applicant.status || 'approved',
    reviewed_by: adminId,
    review_notes: applicant.reviewNotes || 'Seeded for appointment letter testing',
    reviewed_at: new Date(),
  };

  const [existingApp] = await conn.query('SELECT id FROM nss_applications WHERE user_id = ?', [userId]);

  if (existingApp.length > 0) {
    await conn.query(
      `UPDATE nss_applications SET
        nss_number = ?, first_name = ?, last_name = ?, middle_name = ?, date_of_birth = ?, gender = ?, nationality = ?, phone_number = ?, email = ?, residential_address = ?, region = ?, district = ?, institution_name = ?, course_program = ?, year_of_completion = ?, posting_region = ?, posting_district = ?, posting_station = ?, posting_department = ?, service_year = ?, service_period_start = ?, service_period_end = ?, passport_photo = ?, id_card_copy = ?, appointment_letter = ?, certificates = ?, additional_info = ?, status = ?, reviewed_by = ?, review_notes = ?, reviewed_at = ?, updated_at = NOW()
      WHERE user_id = ?`,
      [
        appData.nss_number, appData.first_name, appData.last_name, appData.middle_name, appData.date_of_birth, appData.gender, appData.nationality,
        appData.phone_number, appData.email, appData.residential_address, appData.region, appData.district, appData.institution_name,
        appData.course_program, appData.year_of_completion, appData.posting_region, appData.posting_district, appData.posting_station,
        appData.posting_department, appData.service_year, appData.service_period_start, appData.service_period_end, appData.passport_photo,
        appData.id_card_copy, appData.appointment_letter, appData.certificates, appData.additional_info, appData.status, appData.reviewed_by,
        appData.review_notes, appData.reviewed_at, userId
      ]
    );
    console.log(` Updated application for ${applicant.fullName}`);
  } else {
    await conn.query(
      `INSERT INTO nss_applications (
        user_id, nss_number, first_name, last_name, middle_name, date_of_birth, gender, nationality, phone_number, email, residential_address,
        region, district, institution_name, course_program, year_of_completion, posting_region, posting_district, posting_station, posting_department,
        service_year, service_period_start, service_period_end, passport_photo, id_card_copy, appointment_letter, certificates, additional_info,
        status, reviewed_by, review_notes, reviewed_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        appData.user_id, appData.nss_number, appData.first_name, appData.last_name, appData.middle_name, appData.date_of_birth, appData.gender,
        appData.nationality, appData.phone_number, appData.email, appData.residential_address, appData.region, appData.district,
        appData.institution_name, appData.course_program, appData.year_of_completion, appData.posting_region, appData.posting_district,
        appData.posting_station, appData.posting_department, appData.service_year, appData.service_period_start, appData.service_period_end,
        appData.passport_photo, appData.id_card_copy, appData.appointment_letter, appData.certificates, appData.additional_info,
        appData.status, appData.reviewed_by, appData.review_notes, appData.reviewed_at
      ]
    );
    console.log(` Created application for ${applicant.fullName}`);
  }

  return {
    fullName: applicant.fullName,
    email: applicant.email,
    password: applicant.password,
    nssNumber: applicant.nssNumber,
    postingStation: applicant.postingStation,
    postingDepartment: applicant.postingDepartment,
  };
}

async function main() {
  const cliArgs = parseArgs();
  const seedApplicants = [
    {
      fullName: cliArgs.name1 || 'Ama Boateng',
      email: (cliArgs.email1 || 'ama.boateng@testdvla.com').toLowerCase().trim(),
      password: cliArgs.pass1 || cliArgs.password1 || 'ApplicantPass@2026',
      firstName: 'Ama',
      lastName: 'Boateng',
      middleName: 'Akua',
      nssNumber: cliArgs.nss1 || 'NSS-2026-001',
      dateOfBirth: '2001-03-14',
      gender: 'Female',
      nationality: 'Ghanaian',
      phoneNumber: '+233245000101',
      residentialAddress: 'Plot 12, Adabraka, Accra',
      region: 'Greater Accra',
      district: 'Accra Metropolis',
      institutionName: 'University of Ghana',
      courseProgram: 'Bachelor of Laws',
      yearOfCompletion: 2024,
      postingRegion: 'Greater Accra',
      postingDistrict: 'Accra Metropolis',
      postingStation: 'DVLA Head Office - Cantonments',
      postingDepartment: 'Administration & Human Resources',
      serviceYear: 2026,
      servicePeriodStart: '2026-09-01',
      servicePeriodEnd: '2027-08-31',
      status: 'approved',
      reviewNotes: 'Seeded test applicant for assignment approval flow.',
      additionalInfo: {
        appointmentLetterData: { applicantName: 'Ama Boateng', stationName: 'DVLA Head Office - Cantonments', departmentName: 'Administration & Human Resources' }
      }
    },
    {
      fullName: cliArgs.name2 || 'Kwame Asare',
      email: (cliArgs.email2 || 'kwame.asare@testdvla.com').toLowerCase().trim(),
      password: cliArgs.pass2 || cliArgs.password2 || 'ApplicantPass@2026',
      firstName: 'Kwame',
      lastName: 'Asare',
      middleName: 'Boadu',
      nssNumber: cliArgs.nss2 || 'NSS-2026-002',
      dateOfBirth: '2000-11-08',
      gender: 'Male',
      nationality: 'Ghanaian',
      phoneNumber: '+233244000202',
      residentialAddress: 'No. 8, Asokwa, Kumasi',
      region: 'Ashanti',
      district: 'Kumasi Metropolis',
      institutionName: 'Kwame Nkrumah University of Science and Technology',
      courseProgram: 'Bachelor of Science (IT)',
      yearOfCompletion: 2023,
      postingRegion: 'Ashanti',
      postingDistrict: 'Kumasi Metropolis',
      postingStation: 'Kumasi Regional Office - Adum',
      postingDepartment: 'Driver Licensing & Testing',
      serviceYear: 2026,
      servicePeriodStart: '2026-09-01',
      servicePeriodEnd: '2027-08-31',
      status: 'approved',
      reviewNotes: 'Seeded test applicant for assignment approval flow.',
      additionalInfo: {
        appointmentLetterData: { applicantName: 'Kwame Asare', stationName: 'Kumasi Regional Office - Adum', departmentName: 'Driver Licensing & Testing' }
      }
    },
    {
      fullName: cliArgs.name3 || 'Efua Mensah',
      email: (cliArgs.email3 || 'efua.mensah@testdvla.com').toLowerCase().trim(),
      password: cliArgs.pass3 || cliArgs.password3 || 'ApplicantPass@2026',
      firstName: 'Efua',
      lastName: 'Mensah',
      middleName: '',
      nssNumber: cliArgs.nss3 || 'NSS-2026-003',
      dateOfBirth: '2002-06-22',
      gender: 'Female',
      nationality: 'Ghanaian',
      phoneNumber: '+233246000303',
      residentialAddress: 'House 43, Tamale Central',
      region: 'Northern',
      district: 'Tamale Metropolis',
      institutionName: 'University for Development Studies',
      courseProgram: 'Bachelor of Business Administration',
      yearOfCompletion: 2024,
      postingRegion: 'Northern',
      postingDistrict: 'Tamale Metropolis',
      postingStation: 'Tamale Regional Office',
      postingDepartment: 'Regional Administration',
      serviceYear: 2026,
      servicePeriodStart: '2026-09-01',
      servicePeriodEnd: '2027-08-31',
      status: 'approved',
      reviewNotes: 'Seeded test applicant for assignment approval flow.',
      additionalInfo: {
        appointmentLetterData: { applicantName: 'Efua Mensah', stationName: 'Tamale Regional Office', departmentName: 'Regional Administration' }
      }
    }
  ];

  const { conn, config } = await getConnection();
  console.log('Connected to MySQL at ' + config.host + ':' + config.port + ' (' + config.database + ')');

  try {
    const adminId = await resolveAdminId(conn);
    const seeded = [];

    for (const applicant of seedApplicants) {
      const item = await upsertApplicant(conn, applicant, adminId);
      seeded.push(item);
    }

    console.log('\n' + '='.repeat(80));
    console.log('             TEST APPLICANT SEED COMPLETE');
    console.log('='.repeat(80));
    for (const item of seeded) {
      console.log(`Name: ${item.fullName}`);
      console.log(`Email: ${item.email}`);
      console.log(`Password: ${item.password}`);
      console.log(`NSS: ${item.nssNumber}`);
      console.log(`Posting: ${item.postingStation} / ${item.postingDepartment}`);
      console.log('---');
    }
    console.log('Login URL: http://localhost:5000/login');
    console.log('Admin login remains: admin@dvla.gov.gh / AdminPass@2026');
    console.log('='.repeat(80));
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error('\nSeed failed:', err.message);
  process.exit(1);
});
