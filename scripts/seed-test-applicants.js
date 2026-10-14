const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function seedApplicants() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3307,
    user: 'root',
    password: 'root',
    database: 'dvla_nss_portal',
  });

  console.log(' Connected to dvla_nss_portal on port 3307');

  try {
    const applicants = [
      {
        email: 'lauren.adjetey@example.com',
        password: 'Password@2026',
        fullName: 'Lauren Adwoa Adjetey',
        firstName: 'Lauren',
        middleName: 'Adwoa',
        lastName: 'Adjetey',
        phone: '0240767261',
        nssNumber: 'NSS-2026-7821',
        dob: '2001-06-15',
        gender: 'Female',
        school: 'University of Ghana, Legon',
        course: 'BSc. Computer Science',
        address: 'Hse No 24, Ring Road Central, Accra',
        region: 'Greater Accra',
        district: 'Ayawaso Central',
      },
      {
        email: 'richmond.amoateng@example.com',
        password: 'Password@2026',
        fullName: 'Richmond Kwabena Amoateng',
        firstName: 'Richmond',
        middleName: 'Kwabena',
        lastName: 'Amoateng',
        phone: '0209189872',
        nssNumber: 'NSS-2026-7822',
        dob: '2000-09-21',
        gender: 'Male',
        school: 'Kwame Nkrumah University of Science and Technology',
        course: 'BSc. Information Technology',
        address: 'Plot 12, Airport Residential Area, Accra',
        region: 'Greater Accra',
        district: 'Ayawaso West',
      },
    ];

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Password@2026', salt);

    for (const app of applicants) {
      console.log(`\n--- Seeding ${app.fullName} (${app.phone}) ---`);

      // 1. Clean up existing application with this NSS number or email to avoid collisions
      const [existingUsers] = await conn.query('SELECT id FROM users WHERE email = ?', [app.email]);
      if (existingUsers.length > 0) {
        const uId = existingUsers[0].id;
        await conn.query('DELETE FROM nss_applications WHERE user_id = ?', [uId]);
        await conn.query('DELETE FROM users WHERE id = ?', [uId]);
        console.log(` Cleared previous user record for ${app.email}`);
      }

      // Check if NSS number exists on another user
      await conn.query('DELETE FROM nss_applications WHERE nss_number = ?', [app.nssNumber]);

      // 2. Insert User
      const [userRes] = await conn.query(
        `INSERT INTO users (email, password_hash, role, full_name, created_at, updated_at)
         VALUES (?, ?, 'applicant', ?, NOW(), NOW())`,
        [app.email, passwordHash, app.fullName]
      );
      const userId = userRes.insertId;
      console.log(` Created user account (ID: ${userId})`);

      // 3. Insert NSS Application in 'pending' status
      const [appRes] = await conn.query(
        `INSERT INTO nss_applications (
          user_id, nss_number, first_name, middle_name, last_name,
          date_of_birth, gender, nationality, phone_number, email,
          residential_address, region, district, institution_name, course_program,
          year_of_completion, posting_region, posting_district, service_year,
          status, passport_photo, id_card_copy, appointment_letter, certificates,
          additional_info, created_at, updated_at
        ) VALUES (
          ?, ?, ?, ?, ?,
          ?, ?, 'Ghanaian', ?, ?,
          ?, ?, ?, ?, ?,
          2026, ?, ?, 2026,
          'pending', '/uploads/passport/default.jpg', '/uploads/id_card/default.pdf',
          '/uploads/appointment/default.pdf', '/uploads/certificates/default.pdf',
          JSON_OBJECT('seededForTest', true), NOW(), NOW()
        )`,
        [
          userId,
          app.nssNumber,
          app.firstName,
          app.middleName,
          app.lastName,
          app.dob,
          app.gender,
          app.phone,
          app.email,
          app.address,
          app.region,
          app.district,
          app.school,
          app.course,
          app.region,
          app.district,
        ]
      );

      console.log(` Created pending application (App ID: ${appRes.insertId}) for ${app.fullName} with phone ${app.phone}`);
    }

    console.log('\n======================================================');
    console.log('   NEW TEST APPLICANTS SEEDED SUCCESSFULLY (PENDING)');
    console.log('======================================================');
    console.log('1. Lauren Adwoa Adjetey     | 0240767261 | Status: pending');
    console.log('2. Richmond Kwabena Amoateng | 0209189872 | Status: pending');
    console.log('======================================================\n');
  } finally {
    await conn.end();
  }
}

seedApplicants().catch((err) => {
  console.error('❌ Error seeding applicants:', err);
  process.exit(1);
});
