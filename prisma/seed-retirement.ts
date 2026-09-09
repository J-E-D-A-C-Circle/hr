import { PrismaClient } from "@prisma/client";
import { calculateRetirement } from "../lib/retirement";
import { addDays, addMonths, addYears, subDays, subMonths, subYears } from "date-fns";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding DVLA Staff Retirement Tracking System...");

  // 1. Create DVLA Head Office Departments & Regional Stations
  const departmentsData = [
    { code: "LIC", name: "Driver Licensing Directorate", type: "DEPARTMENT", location: "Head Office, Accra", headOfDept: "Mr. Kwaku Bonsu", description: "Driver license examination and issuance" },
    { code: "VINS", name: "Vehicle Inspection & Testing", type: "DEPARTMENT", location: "Head Office, Accra", headOfDept: "Ing. Samuel Osei", description: "Automated vehicle roadworthiness assessment" },
    { code: "IT", name: "ICT & Digital Innovations", type: "DEPARTMENT", location: "Head Office, Accra", headOfDept: "Mrs. Abena Mansa", description: "Enterprise IT infrastructure and software systems" },
    { code: "HR", name: "Human Resource Directorate", type: "DEPARTMENT", location: "Head Office, Accra", headOfDept: "Dr. Evelyn Mensah", description: "Staff tracking, pensions, and statutory retirement" },
    { code: "FIN", name: "Finance & Accounts Division", type: "DEPARTMENT", location: "Head Office, Accra", headOfDept: "Mr. Michael Addo", description: "Financial reporting, payroll, and revenue audit" },
    { code: "LEG", name: "Legal Services & Compliance", type: "DEPARTMENT", location: "Head Office, Accra", headOfDept: "Barrister Cynthia Kwarteng", description: "Regulatory compliance and legal advocacy" },
    { code: "OPS", name: "Regional Operations & Transport", type: "DEPARTMENT", location: "Head Office, Accra", headOfDept: "Mr. Ebenezer Armah", description: "National station supervision and logistics" },
    { code: "DIT", name: "Driver Training & Assessment", type: "DEPARTMENT", location: "Head Office, Accra", headOfDept: "Capt. (Rtd) James Appiah", description: "Driving school accreditation and testing standards" },
    // Regional Stations
    { code: "STN-KMS", name: "Kumasi Regional Station", type: "STATION", location: "Ashanti Region, Kumasi", headOfDept: "Ing. Richard Mensah", description: "Ashanti Regional operational station" },
    { code: "STN-TKR", name: "Takoradi Regional Station", type: "STATION", location: "Western Region, Takoradi", headOfDept: "Mrs. Grace Osei", description: "Western Region operations" },
    { code: "STN-TMA", name: "Tema Regional Office", type: "STATION", location: "Greater Accra, Tema", headOfDept: "Mr. Francis Addo", description: "Harbour and heavy vehicle testing center" },
    { code: "STN-TML", name: "Tamale Regional Station", type: "STATION", location: "Northern Region, Tamale", headOfDept: "Alhaji Salifu Yakubu", description: "Northern sector station" },
    { code: "STN-CPC", name: "Cape Coast Regional Station", type: "STATION", location: "Central Region, Cape Coast", headOfDept: "Mr. Kweku Baidoo", description: "Central Region licensing and testing" },
  ];

  const depts: Record<string, number> = {};

  for (const dept of departmentsData) {
    const created = await prisma.retirementDepartment.upsert({
      where: { code: dept.code },
      update: { name: dept.name, type: dept.type, location: dept.location, headOfDept: dept.headOfDept, description: dept.description },
      create: dept,
    });
    depts[dept.code] = created.id;
  }

  // 2. Create System Users (HR Administrator & HR Officer)
  await prisma.retirementUser.upsert({
    where: { email: "admin@dvla.gov.gh" },
    update: {},
    create: {
      email: "admin@dvla.gov.gh",
      username: "admin",
      fullName: "Kofi Owusu (HR Admin)",
      passwordHash: "plain:admin123",
      role: "HR_ADMINISTRATOR",
      active: true,
    },
  });

  await prisma.retirementUser.upsert({
    where: { email: "officer@dvla.gov.gh" },
    update: {},
    create: {
      email: "officer@dvla.gov.gh",
      username: "officer",
      fullName: "Akosua Frimpong (HR Officer)",
      passwordHash: "plain:officer123",
      role: "HR_OFFICER",
      active: true,
    },
  });

  // 3. Create Staff Members across all retirement stages
  const today = new Date();

  // Helper to construct staff record
  const rawStaffList = [
    // --- DUE THIS YEAR (< 12 Months Remaining) ---
    {
      staffId: "DVLA-10001",
      fullName: "Emmanuel Kwesi Darko",
      gender: "Male",
      deptCode: "LIC",
      jobTitle: "Chief Licensing Officer",
      grade: "Director (Grade 12)",
      dob: subDays(subYears(today, 60), -150), // Turns 60 in ~5 months
      dofa: subYears(today, 32),
      email: "e.darko@dvla.gov.gh",
      phone: "+233 24 412 3456",
    },
    {
      staffId: "DVLA-10002",
      fullName: "Gladys Serwaa Ampofo",
      gender: "Female",
      deptCode: "HR",
      jobTitle: "Deputy Director HR",
      grade: "Deputy Director",
      dob: subDays(subYears(today, 60), -60), // Turns 60 in 2 months
      dofa: subYears(today, 34),
      email: "g.ampofo@dvla.gov.gh",
      phone: "+233 20 899 1122",
    },
    {
      staffId: "DVLA-10003",
      fullName: "Francis Kwame Baah",
      gender: "Male",
      deptCode: "VINS",
      jobTitle: "Senior Vehicle Inspector",
      grade: "Principal Officer",
      dob: subDays(subYears(today, 60), -240), // Turns 60 in 8 months
      dofa: subYears(today, 29),
      email: "f.baah@dvla.gov.gh",
      phone: "+233 27 554 9900",
    },
    {
      staffId: "DVLA-10004",
      fullName: "Theresa Aba Boateng",
      gender: "Female",
      deptCode: "FIN",
      jobTitle: "Principal Accountant",
      grade: "Principal Officer",
      dob: subDays(subYears(today, 60), -300), // Turns 60 in 10 months
      dofa: subYears(today, 31),
      email: "t.boateng@dvla.gov.gh",
      phone: "+233 24 332 1188",
    },
    {
      staffId: "DVLA-10005",
      fullName: "Isaac Kobina Mensah",
      gender: "Male",
      deptCode: "OPS",
      jobTitle: "Head of Regional Fleet",
      grade: "Senior Manager",
      dob: subDays(subYears(today, 60), -30), // Turns 60 in 1 month!
      dofa: subYears(today, 35),
      email: "i.mensah@dvla.gov.gh",
      phone: "+233 50 677 8899",
    },

    // --- NEARING RETIREMENT (1 - 5 Years Remaining) ---
    {
      staffId: "DVLA-10006",
      fullName: "Kwadwo Asare Bediako",
      gender: "Male",
      deptCode: "IT",
      jobTitle: "Head of Database Systems",
      grade: "Senior Manager",
      dob: subYears(today, 58), // Turns 60 in 2 years
      dofa: subYears(today, 25),
      email: "k.bediako@dvla.gov.gh",
      phone: "+233 24 999 0011",
    },
    {
      staffId: "DVLA-10007",
      fullName: "Priscilla Adwoa Donkor",
      gender: "Female",
      deptCode: "LIC",
      jobTitle: "Licensing Supervisor",
      grade: "Senior Officer",
      dob: subYears(today, 57), // Turns 60 in 3 years
      dofa: subYears(today, 22),
      email: "p.donkor@dvla.gov.gh",
      phone: "+233 26 123 4567",
    },
    {
      staffId: "DVLA-10008",
      fullName: "Ing. Patrick Kofi Techie",
      gender: "Male",
      deptCode: "VINS",
      jobTitle: "Chief Vehicle Examiner",
      grade: "Chief Officer",
      dob: subYears(today, 56), // Turns 60 in 4 years
      dofa: subYears(today, 28),
      email: "p.techie@dvla.gov.gh",
      phone: "+233 24 555 6677",
    },
    {
      staffId: "DVLA-10009",
      fullName: "Mercy Yaa Konadu",
      gender: "Female",
      deptCode: "LEG",
      jobTitle: "Senior Legal Counsel",
      grade: "Principal Officer",
      dob: subYears(today, 58), // Turns 60 in 2 years
      dofa: subYears(today, 20),
      email: "m.konadu@dvla.gov.gh",
      phone: "+233 20 444 3322",
    },
    {
      staffId: "DVLA-10010",
      fullName: "Samuel Yaw Ofori",
      gender: "Male",
      deptCode: "DIT",
      jobTitle: "Chief Driving Examiner",
      grade: "Chief Officer",
      dob: subYears(today, 55), // Turns 60 in 5 years
      dofa: subYears(today, 27),
      email: "s.ofori@dvla.gov.gh",
      phone: "+233 27 888 7766",
    },
    {
      staffId: "DVLA-10011",
      fullName: "Hannah Afia Pokuaa",
      gender: "Female",
      deptCode: "HR",
      jobTitle: "Staff Records Manager",
      grade: "Senior Manager",
      dob: subYears(today, 57), // Turns 60 in 3 years
      dofa: subYears(today, 24),
      email: "h.pokuaa@dvla.gov.gh",
      phone: "+233 24 111 2233",
    },
    {
      staffId: "DVLA-10012",
      fullName: "Benjamin Nii Lartey",
      gender: "Male",
      deptCode: "FIN",
      jobTitle: "Revenue Audit Manager",
      grade: "Senior Manager",
      dob: subYears(today, 56), // Turns 60 in 4 years
      dofa: subYears(today, 23),
      email: "b.lartey@dvla.gov.gh",
      phone: "+233 55 999 8877",
    },

    // --- ACTIVE (> 5 Years Remaining) ---
    {
      staffId: "DVLA-10013",
      fullName: "Daniel Kwabena Antwi",
      gender: "Male",
      deptCode: "IT",
      jobTitle: "Senior Software Engineer",
      grade: "Senior Officer",
      dob: subYears(today, 38), // Turns 60 in 22 years
      dofa: subYears(today, 8),
      email: "d.antwi@dvla.gov.gh",
      phone: "+233 24 777 8899",
    },
    {
      staffId: "DVLA-10014",
      fullName: "Eunice Akosua Kyei",
      gender: "Female",
      deptCode: "LIC",
      jobTitle: "Biometric Data Officer",
      grade: "Officer",
      dob: subYears(today, 32), // Turns 60 in 28 years
      dofa: subYears(today, 4),
      email: "e.kyei@dvla.gov.gh",
      phone: "+233 20 333 4455",
    },
    {
      staffId: "DVLA-10015",
      fullName: "George Kwame Agyei",
      gender: "Male",
      deptCode: "VINS",
      jobTitle: "Assistant Vehicle Inspector",
      grade: "Assistant Officer",
      dob: subYears(today, 29), // Turns 60 in 31 years
      dofa: subYears(today, 2),
      email: "g.agyei@dvla.gov.gh",
      phone: "+233 50 112 2334",
    },
    {
      staffId: "DVLA-10016",
      fullName: "Rita Mensah Quaye",
      gender: "Female",
      deptCode: "HR",
      jobTitle: "HR Assistant",
      grade: "Assistant Officer",
      dob: subYears(today, 26), // Turns 60 in 34 years
      dofa: subYears(today, 1),
      email: "r.quaye@dvla.gov.gh",
      phone: "+233 24 666 5544",
    },
    {
      staffId: "DVLA-10017",
      fullName: "Charles Kwesi Sarfo",
      gender: "Male",
      deptCode: "OPS",
      jobTitle: "Logistics Officer",
      grade: "Officer",
      dob: subYears(today, 45), // Turns 60 in 15 years
      dofa: subYears(today, 14),
      email: "c.sarfo@dvla.gov.gh",
      phone: "+233 27 222 3344",
    },
    {
      staffId: "DVLA-10018",
      fullName: "Florence Ama Badu",
      gender: "Female",
      deptCode: "FIN",
      jobTitle: "Accounts Officer",
      grade: "Officer",
      dob: subYears(today, 41), // Turns 60 in 19 years
      dofa: subYears(today, 10),
      email: "f.badu@dvla.gov.gh",
      phone: "+233 20 777 6655",
    },

    // --- RETIRED (Already Reached Age 60) ---
    {
      staffId: "DVLA-10019",
      fullName: "Joseph Kojo Gyasi",
      gender: "Male",
      deptCode: "OPS",
      jobTitle: "Former Director Operations",
      grade: "Director",
      dob: subYears(today, 62), // Reached 60 2 years ago
      dofa: subYears(today, 36),
      email: "j.gyasi@dvla.gov.gh",
      phone: "+233 24 888 1122",
    },
    {
      staffId: "DVLA-10020",
      fullName: "Beatrice Efua Mills",
      gender: "Female",
      deptCode: "LIC",
      jobTitle: "Former Chief Licensing Registrar",
      grade: "Chief Officer",
      dob: subYears(today, 61), // Reached 60 1 year ago
      dofa: subYears(today, 35),
      email: "b.mills@dvla.gov.gh",
      phone: "+233 20 999 4433",
    },
    {
      staffId: "DVLA-10021",
      fullName: "Godfred Yaw Tetteh",
      gender: "Male",
      deptCode: "VINS",
      jobTitle: "Former Head Vehicle Inspection",
      grade: "Director",
      dob: subYears(today, 63), // Reached 60 3 years ago
      dofa: subYears(today, 38),
      email: "g.tetteh@dvla.gov.gh",
      phone: "+233 27 444 5566",
    },
  ];

  for (const s of rawStaffList) {
    const calc = calculateRetirement(s.dob, s.dofa, today);
    const departmentId = depts[s.deptCode] || null;

    const createdStaff = await prisma.retirementStaff.upsert({
      where: { staffId: s.staffId },
      update: {
        fullName: s.fullName,
        dateOfBirth: s.dob,
        gender: s.gender,
        departmentId,
        departmentName: departmentsData.find((d) => d.code === s.deptCode)?.name,
        jobTitle: s.jobTitle,
        grade: s.grade,
        dateOfFirstAppointment: s.dofa,
        retirementDate: calc.retirementDate,
        actualRetirementDate: calc.status === "RETIRED" ? calc.retirementDate : null,
        retirementStatus: calc.status,
        email: s.email,
        phone: s.phone,
        active: true,
      },
      create: {
        staffId: s.staffId,
        fullName: s.fullName,
        dateOfBirth: s.dob,
        gender: s.gender,
        departmentId,
        departmentName: departmentsData.find((d) => d.code === s.deptCode)?.name,
        jobTitle: s.jobTitle,
        grade: s.grade,
        dateOfFirstAppointment: s.dofa,
        retirementDate: calc.retirementDate,
        actualRetirementDate: calc.status === "RETIRED" ? calc.retirementDate : null,
        retirementStatus: calc.status,
        email: s.email,
        phone: s.phone,
        active: true,
      },
    });

    // Create alerts if nearing or due this year
    if (calc.status === "DUE_THIS_YEAR" || calc.status === "NEARING_RETIREMENT") {
      const milestone = calc.yearsRemaining < 1 ? "1_YEAR" : calc.yearsRemaining <= 3 ? "3_YEARS" : "5_YEARS";
      await prisma.retirementAlert.upsert({
        where: {
          staffId_milestone: {
            staffId: createdStaff.id,
            milestone,
          },
        },
        update: {},
        create: {
          staffId: createdStaff.id,
          milestone,
          status: "UNREAD",
        },
      });
    }
  }

  // 4. Default Settings
  await prisma.retirementSetting.upsert({
    where: { key: "statutory_retirement_age" },
    update: {},
    create: { key: "statutory_retirement_age", value: "60" },
  });

  await prisma.retirementSetting.upsert({
    where: { key: "alert_milestones" },
    update: {},
    create: { key: "alert_milestones", value: "5_YEARS,3_YEARS,1_YEAR,6_MONTHS" },
  });

  console.log("✅ DVLA Retirement System Seeded Successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
