export const initialStaff = [
  {
    staffId: "HR-2026-000",
    fullName: "Constance Akua Essuman",
    department: "Driver Licensing & Executive Administration",
    jobTitle: "Senior Licensing & HR Director",
    email: "constanceakua.essuman@dvla.gov.gh",
    phone: "+233 24 555 7788",
    appointmentDate: "2022-01-15",
    status: "ACTIVE" as const,
    salaryGrade: "Grade 16 Step 5",
    reportingOfficer: "Director-General DVLA",
  },
  {
    staffId: "HR-2026-001",
    fullName: "Kofi Mensah",
    department: "Driver Licensing & Administration",
    jobTitle: "Senior Licensing Officer",
    email: "kofi.mensah@dvla.gov.gh",
    phone: "+233 24 123 4567",
    appointmentDate: "2023-03-15",
    status: "ACTIVE" as const,
    salaryGrade: "Grade 12 Step 4",
    reportingOfficer: "Ephraim Nii Tan Sackey",
  },
  {
    staffId: "HR-2026-002",
    fullName: "Abena Osei",
    department: "Human Resource & Administration",
    jobTitle: "HR Assistant Manager",
    email: "abena.osei@dvla.gov.gh",
    phone: "+233 20 987 6543",
    appointmentDate: "2022-06-01",
    status: "ACTIVE" as const,
    salaryGrade: "Grade 14 Step 2",
    reportingOfficer: "Ephraim Nii Tan Sackey",
  },
  {
    staffId: "HR-2026-003",
    fullName: "Kwame Nkrumah Appiah",
    department: "Vehicle Inspection & Testing",
    jobTitle: "Vehicle Inspector Class I",
    email: "kwame.appiah@dvla.gov.gh",
    phone: "+233 55 444 3322",
    appointmentDate: "2024-01-10",
    status: "PROBATION" as const,
    salaryGrade: "Grade 10 Step 1",
    reportingOfficer: "Samuel Boakye",
  },
  {
    staffId: "HR-2026-004",
    fullName: "Akosua Dede",
    department: "Finance & Audit",
    jobTitle: "Internal Auditor",
    email: "akosua.dede@dvla.gov.gh",
    phone: "+233 27 888 9911",
    appointmentDate: "2021-09-20",
    status: "ACTIVE" as const,
    salaryGrade: "Grade 13 Step 3",
    reportingOfficer: "Grace Addo",
  },
];

export const initialTemplates = [
  {
    title: "Official Appointment Letter",
    type: "APPOINTMENT" as const,
    description: "Standard appointment offer letter for newly recruited full-time or temporary personnel.",
    version: 1,
    content: `Dear {{staff_name}},

RE: OFFER OF APPOINTMENT AS {{job_title}}

I am pleased to inform you that management has approved your appointment as {{job_title}} in the {{department}} Department of the Driver and Vehicle Licensing Authority (DVLA).

1. EFFECTIVE DATE & SALARY:
Your appointment takes effect from {{start_date}}. You will be placed on Salary {{salary_grade}}.

2. REPORTING OFFICER:
You will report directly to the {{reporting_officer}}.

3. PROBATION & CONDITIONS:
This appointment is subject to a probation period of six (6) months, after which your performance will be evaluated for formal confirmation.

Please sign and acknowledge this letter on the portal to signify your acceptance of the terms and conditions outlined herein.

Yours faithfully,

EPHRAIM NII TAN SACKEY
AG. DIRECTOR, HUMAN RESOURCE`,
  },
  {
    title: "Letter of Promotion",
    type: "PROMOTION" as const,
    description: "Formal letter notifying staff member of elevation in rank, grade, and responsibility.",
    version: 1,
    content: `Dear {{staff_name}},

RE: PROMOTION TO {{job_title}}

Management is pleased to inform you that following the recent promotional appraisals, you have been promoted to the position of {{job_title}} in the {{department}} Department.

1. EFFECTIVE DATE & SALARY ADJUSTMENT:
Your promotion takes effect on {{start_date}}. Your new remuneration will be on {{salary_grade}}.

2. DUTIES & RESPONSIBILITIES:
You will continue to report to {{reporting_officer}} while assuming higher supervisory duties as detailed in your updated job description.

Management congratulates you on this milestone and trusts you will continue your dedicated service.

Yours faithfully,

EPHRAIM NII TAN SACKEY
AG. DIRECTOR, HUMAN RESOURCE`,
  },
  {
    title: "Formal Confirmation of Appointment",
    type: "CONFIRMATION" as const,
    description: "Notification confirming staff member's position after successful probation completion.",
    version: 1,
    content: `Dear {{staff_name}},

RE: CONFIRMATION OF APPOINTMENT

Following the satisfactory completion of your six (6) month probationary period, I am pleased to inform you that your appointment as {{job_title}} in the {{department}} Department is hereby CONFIRMED.

Your salary remains on {{salary_grade}} with full permanent staff benefits.

Congratulations on your successful confirmation.

Yours faithfully,

EPHRAIM NII TAN SACKEY
AG. DIRECTOR, HUMAN RESOURCE`,
  },
  {
    title: "Inter-Departmental Transfer Letter",
    type: "TRANSFER" as const,
    description: "Letter notifying employee of relocation or departmental reassignment.",
    version: 1,
    content: `Dear {{staff_name}},

RE: INTER-DEPARTMENTAL TRANSFER

Management has decided to reassign you from your current role to {{job_title}} within the {{department}} Department with effect from {{start_date}}.

You are advised to complete all handing over notes with your current head of unit before assuming duty at your new posting under {{reporting_officer}}.

Yours faithfully,

EPHRAIM NII TAN SACKEY
AG. DIRECTOR, HUMAN RESOURCE`,
  },
  {
    title: "Official Disciplinary Warning Letter",
    type: "WARNING" as const,
    description: "Formal warning letter issued for administrative or compliance policy infractions.",
    version: 1,
    content: `Dear {{staff_name}},

RE: FORMAL WARNING LETTER

This letter serves as a formal written warning regarding your recent attendance and administrative policy infractions in the {{department}} Department.

You are required to adhere strictly to Authority workplace standards and report to {{reporting_officer}}. Failure to comply will result in further disciplinary action in accordance with DVLA Condition of Service.

Yours faithfully,

EPHRAIM NII TAN SACKEY
AG. DIRECTOR, HUMAN RESOURCE`,
  },
  {
    title: "Contract Renewal Letter",
    type: "CONTRACT_RENEWAL" as const,
    description: "Notification extending staff contract tenure for an additional operational period.",
    version: 1,
    content: `Dear {{staff_name}},

RE: RENEWAL OF CONTRACT OF SERVICE

I am pleased to inform you that Management has approved the renewal of your contract of service as {{job_title}} in the {{department}} Department.

1. TENURE & START DATE:
The renewed tenure takes effect from {{start_date}} on Salary {{salary_grade}}.

2. SUPERVISION:
You will continue reporting directly to {{reporting_officer}}.

Please log into the staff portal to digitally acknowledge and accept the renewed terms.

Yours faithfully,

EPHRAIM NII TAN SACKEY
AG. DIRECTOR, HUMAN RESOURCE`,
  },
  {
    title: "Official Leave Approval Letter",
    type: "LEAVE_APPROVAL" as const,
    description: "Approval letter for annual, study, or casual leave duration.",
    version: 1,
    content: `Dear {{staff_name}},

RE: APPROVAL OF ANNUAL / CASUAL LEAVE

Management has approved your request for leave in respect of your position as {{job_title}} in the {{department}} Department.

Your leave commences on {{start_date}}. You are expected to resume duty on your scheduled return date and report to {{reporting_officer}}.

Yours faithfully,

EPHRAIM NII TAN SACKEY
AG. DIRECTOR, HUMAN RESOURCE`,
  },
];
