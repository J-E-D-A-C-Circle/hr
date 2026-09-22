const fs = require('fs');
const path = require('path');
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  WidthType,
  ShadingType,
  PageBreak
} = require('docx');

// Helper to create styled paragraphs
function createTitle(text) {
  return new Paragraph({
    text: text,
    heading: HeadingLevel.TITLE,
    spacing: { before: 240, after: 120 },
    run: { font: "Calibri", size: 40, bold: true, color: "1F4E78" }
  });
}

function createHeading1(text) {
  return new Paragraph({
    text: text,
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 240, after: 120 },
    run: { font: "Calibri", size: 28, bold: true, color: "1F4E78" }
  });
}

function createHeading2(text) {
  return new Paragraph({
    text: text,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 180, after: 80 },
    run: { font: "Calibri", size: 22, bold: true, color: "2E75B6" }
  });
}

function createHeading3(text) {
  return new Paragraph({
    text: text,
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 120, after: 60 },
    run: { font: "Calibri", size: 18, bold: true, color: "333333" }
  });
}

function createBodyPara(text, options = {}) {
  const runs = [];
  if (typeof text === 'string') {
    runs.push(new TextRun({ text: text, font: "Calibri", size: 22, ...options }));
  } else if (Array.isArray(text)) {
    text.forEach(item => {
      if (typeof item === 'string') {
        runs.push(new TextRun({ text: item, font: "Calibri", size: 22 }));
      } else {
        runs.push(new TextRun({ font: "Calibri", size: 22, ...item }));
      }
    });
  }
  return new Paragraph({
    children: runs,
    spacing: { before: 60, after: 100 }
  });
}

function createBulletItem(text, boldPrefix = "") {
  const runs = [];
  if (boldPrefix) {
    runs.push(new TextRun({ text: boldPrefix, bold: true, font: "Calibri", size: 22 }));
  }
  runs.push(new TextRun({ text: text, font: "Calibri", size: 22 }));
  return new Paragraph({
    children: runs,
    bullet: { level: 0 },
    spacing: { before: 40, after: 40 }
  });
}

function createCallout(text, title = "NOTE") {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: `[${title}] `, bold: true, color: "1F4E78", font: "Calibri", size: 20 }),
                  new TextRun({ text: text, font: "Calibri", size: 20, italic: true })
                ],
                spacing: { before: 60, after: 60 }
              })
            ],
            shading: { fill: "F2F4F7", type: ShadingType.CLEAR },
            borders: {
              left: { style: BorderStyle.SINGLE, size: 24, color: "1F4E78" },
              top: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE }
            },
            margins: { top: 100, bottom: 100, left: 150, right: 150 }
          })
        ]
      })
    ]
  });
}

// Generate SRS Document
function generateSRSDoc() {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        createTitle("Software Requirements Specification (SRS)"),
        createHeading3("DVLA Integrated HR & Workforce Management Suite"),
        createBodyPara("This document outlines the software requirements, system features, and security framework for the Integrated HR & Workforce Management Suite."),
        
        createHeading1("1. System Overview & Objectives"),
        createBodyPara("The DVLA Integrated HR & Workforce Management Suite is a web-based portal built using Next.js, React, and MySQL to automate core human resource functions. The system eliminates manual spreadsheet tracking, reduces administrative overhead, ensures statutory compliance, and secures official record-keeping through four dedicated sub-systems:"),
        
        createBulletItem(" Contract lifecycle tracking, 6-month auto-computation, monthly validations, and statutory deduction calculations (SSNIT & Petra Tier 3).", "1. TempStaff Management Portal:"),
        createBulletItem(" Tracking employee retirement dates, multi-stage milestone alerts (5yr, 3yr, 1yr, 6mo), department structures, and clearance workflows.", "2. Retirement Planning & Alert Portal:"),
        createBulletItem(" Templated HR letter creation (Appointment, Renewal, Confirmation, Promotion, Transfer, Warning), approval workflows, digital signatures, and QR code verification.", "3. HR Letters & Document Portal:"),
        createBulletItem(" System-wide user management, global announcements, master data configuration (Banks, Insurance providers, Grades), and centralized audit logging.", "4. Central Super Admin Control Portal:"),
        
        createHeading1("2. Feature Analysis Table"),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({ children: [createBodyPara("Sub-System", { bold: true, color: "FFFFFF" })], shading: { fill: "1F4E78" } }),
                new TableCell({ children: [createBodyPara("Key Feature", { bold: true, color: "FFFFFF" })], shading: { fill: "1F4E78" } }),
                new TableCell({ children: [createBodyPara("Operational Description", { bold: true, color: "FFFFFF" })], shading: { fill: "1F4E78" } }),
                new TableCell({ children: [createBodyPara("Target Roles", { bold: true, color: "FFFFFF" })], shading: { fill: "1F4E78" } }),
                new TableCell({ children: [createBodyPara("Security & Rules", { bold: true, color: "FFFFFF" })], shading: { fill: "1F4E78" } }),
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ children: [createBodyPara("TempStaff Portal")] }),
                new TableCell({ children: [createBodyPara("Contract Lifecycle & Auto-Renewal")] }),
                new TableCell({ children: [createBodyPara("Auto-computes 6-month contract end dates. Supports single/bulk renewal and termination tracking.")] }),
                new TableCell({ children: [createBodyPara("HR Officers, HR Managers")] }),
                new TableCell({ children: [createBodyPara("Enforces 1 active contract per staff ID. Logs full contract history.")] }),
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ children: [createBodyPara("TempStaff Portal")] }),
                new TableCell({ children: [createBodyPara("Deduction & Payslip Engine")] }),
                new TableCell({ children: [createBodyPara("Calculates SSNIT (Employee 5.5%, Employer 13%) and Petra Tier 3 (5% + 5%). Generates payslips.")] }),
                new TableCell({ children: [createBodyPara("Payroll Admin, HR Manager")] }),
                new TableCell({ children: [createBodyPara("Configurable rates in deduction_settings. Validates payment status.")] }),
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ children: [createBodyPara("TempStaff Portal")] }),
                new TableCell({ children: [createBodyPara("Excel Bulk Import & Export")] }),
                new TableCell({ children: [createBodyPara("Import/Export staff lists, Petra templates, SSNIT schedules, and payment adjustments.")] }),
                new TableCell({ children: [createBodyPara("HR Admin, Data Entry")] }),
                new TableCell({ children: [createBodyPara("Validates Staff Code uniqueness, SSNIT format, and Ghana Card (NIA).")] }),
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ children: [createBodyPara("Retirement Portal")] }),
                new TableCell({ children: [createBodyPara("Milestone Alert Engine")] }),
                new TableCell({ children: [createBodyPara("Auto-detects retirement dates and triggers alerts at 5Yrs, 3Yrs, 1Yr, and 6Mos.")] }),
                new TableCell({ children: [createBodyPara("HR Officers, Dept Heads")] }),
                new TableCell({ children: [createBodyPara("Access restricted by role (HR_ADMINISTRATOR vs HR_OFFICER).")] }),
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ children: [createBodyPara("Retirement Portal")] }),
                new TableCell({ children: [createBodyPara("Clearance & Grade Management")] }),
                new TableCell({ children: [createBodyPara("Manages station/department assignments, pension factors, and exit clearances.")] }),
                new TableCell({ children: [createBodyPara("HR Management")] }),
                new TableCell({ children: [createBodyPara("Foreign key constraints ensure data consistency across staff & depts.")] }),
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ children: [createBodyPara("HR Letters Portal")] }),
                new TableCell({ children: [createBodyPara("Template & Letter Generator")] }),
                new TableCell({ children: [createBodyPara("Generates official HR letters (Appointment, Promotion, Warning, Transfer, Renewal).")] }),
                new TableCell({ children: [createBodyPara("HR Officers, Directors")] }),
                new TableCell({ children: [createBodyPara("Draft & approval controls (DRAFT, PENDING_APPROVAL, APPROVED, ISSUED).")] }),
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ children: [createBodyPara("HR Letters Portal")] }),
                new TableCell({ children: [createBodyPara("Document Verification & QR")] }),
                new TableCell({ children: [createBodyPara("Generates unique verification codes and embedded QR codes to authenticate letters.")] }),
                new TableCell({ children: [createBodyPara("External Verifiers, Management")] }),
                new TableCell({ children: [createBodyPara("Anti-tamper verification code hashing prevents altering.")] }),
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ children: [createBodyPara("HR Letters Portal")] }),
                new TableCell({ children: [createBodyPara("Digital Signatures & Approvals")] }),
                new TableCell({ children: [createBodyPara("Multi-level approval workflows for HR Directors to digitally sign letters.")] }),
                new TableCell({ children: [createBodyPara("HR Director, Approvers")] }),
                new TableCell({ children: [createBodyPara("Long-text signature hash storage with timestamped audit logs.")] }),
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ children: [createBodyPara("Super Admin Portal")] }),
                new TableCell({ children: [createBodyPara("Global User & Access Control")] }),
                new TableCell({ children: [createBodyPara("Manages system accounts across all portals (TempStaff, Retirement, HR Letters).")] }),
                new TableCell({ children: [createBodyPara("Super Admin")] }),
                new TableCell({ children: [createBodyPara("Middleware cookie-session checks; passwords hashed via bcrypt/SHA.")] }),
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ children: [createBodyPara("Super Admin Portal")] }),
                new TableCell({ children: [createBodyPara("System Announcements & Audit")] }),
                new TableCell({ children: [createBodyPara("Broadcasts system messages across portals and records every action across modules.")] }),
                new TableCell({ children: [createBodyPara("All Users (View), Super Admin")] }),
                new TableCell({ children: [createBodyPara("Immutably appends user actions, IPs, timestamps, and target records.")] }),
              ]
            }),
          ]
        }),
        
        createHeading1("3. Security Measures and Features Put in Place"),
        createHeading2("A. Route Protection & Middleware Cookie Session Validation"),
        createBulletItem(" Access to portal routes (/admin, /retirement, /hrletters, /dashboard) is strictly governed by Next.js edge middleware.", "Portal Scope Isolation:"),
        createBulletItem(" Unauthenticated visitors are automatically redirected to login pages. Session cookies rely on JSON payloads with active role verification.", "Session Cookie Integrity:"),
        
        createHeading2("B. Role-Based Access Control (RBAC)"),
        createBulletItem(" Users are assigned explicit roles (SUPER_ADMIN, HR_DIRECTOR, HR_OFFICER, PAYROLL_ADMIN). Key tasks like contract terminations, deduction rate modifications, user provisioning, and letter sign-offs require elevated rights.", "Granular Permissions:"),
        
        createHeading2("C. Comprehensive Multi-Portal Audit Logging"),
        createBulletItem(" Every database mutation, renewal, termination, rate adjustment, or export is recorded in audit log tables (audit_logs, retirement_audit_logs, hr_letter_audit_logs) capturing actor name, role, timestamp, action type, and details.", "Immutable Logs:"),
        
        createHeading2("D. Anti-Forgery & Verification Mechanisms"),
        createBulletItem(" Every issued document generates a unique verification hash.", "Verification Codes:"),
        createBulletItem(" Embedded QR codes allow instant online validation of physical printed letters.", "QR Code Validation:"),
        createBulletItem(" Digital signature hashes are cryptographically sealed upon approval.", "Digital Signatures:"),

        createHeading1("4. System Access Credentials Placeholders"),
        createCallout("Please fill in your active portal URLs, administrative usernames, and passwords below.", "CREDENTIAL PLACEHOLDERS"),
        
        createHeading2("Super Admin Control Portal"),
        createBulletItem(" [INSERT SUPER ADMIN PORTAL URL HERE]", "URL:"),
        createBulletItem(" [INSERT SUPER ADMIN USERNAME HERE]", "Username:"),
        createBulletItem(" [INSERT SUPER ADMIN PASSWORD HERE]", "Password:"),
        
        createHeading2("TempStaff Management Portal"),
        createBulletItem(" [INSERT TEMPSTAFF PORTAL URL HERE]", "URL:"),
        createBulletItem(" [INSERT TEMPSTAFF USERNAME HERE]", "Username:"),
        createBulletItem(" [INSERT TEMPSTAFF PASSWORD HERE]", "Password:"),
        
        createHeading2("Retirement Planning & Alert Portal"),
        createBulletItem(" [INSERT RETIREMENT PORTAL URL HERE]", "URL:"),
        createBulletItem(" [INSERT RETIREMENT USERNAME HERE]", "Username:"),
        createBulletItem(" [INSERT RETIREMENT PASSWORD HERE]", "Password:"),

        createHeading2("HR Letters & Document Portal"),
        createBulletItem(" [INSERT HR LETTERS PORTAL URL HERE]", "URL:"),
        createBulletItem(" [INSERT HR LETTERS USERNAME HERE]", "Username:"),
        createBulletItem(" [INSERT HR LETTERS PASSWORD HERE]", "Password:"),
        
        createHeading2("Database Server Credentials"),
        createBulletItem(" [INSERT DB IP / HOSTNAME HERE]", "Host/IP:"),
        createBulletItem(" [INSERT DB PORT HERE e.g. 3306 or 3307]", "Port:"),
        createBulletItem(" [INSERT DATABASE NAME HERE]", "Database Name:"),
        createBulletItem(" [INSERT DB USERNAME HERE]", "DB Username:"),
        createBulletItem(" [INSERT DB PASSWORD HERE]", "DB Password:"),
      ]
    }]
  });
  return doc;
}

// Generate Management Report Document
function generateReportDoc() {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        createTitle("Management Technical Report"),
        createHeading3("Integrated HR & Workforce Management System Suite"),
        
        createBodyPara([
          { text: "TO: ", bold: true }, { text: "Management / Executive Committee\n" },
          { text: "FROM: ", bold: true }, { text: "HR Systems & Technology Team\n" },
          { text: "DATE: ", bold: true }, { text: "September 22, 2026\n" },
          { text: "SUBJECT: ", bold: true }, { text: "Technical Report & Delivery Summary: Integrated HR & Payroll Management System Suite" }
        ]),
        
        createHeading1("Executive Summary"),
        createBodyPara("We have deployed the Integrated HR & Payroll Management System Suite. This platform replaces manual processes and dispersed spreadsheets with a centralized, web-based platform tailored for managing temporary staff, retirement schedules, official HR letter issuance, and central administration."),
        
        createHeading1("Key Functional Systems & Operational Benefits"),
        createBulletItem(" Eliminates contract default risks by calculating 6-month contract spans and maintaining renewal history. Auto-computes SSNIT Tier 1 and Petra Tier 3 Pension deductions with instant payslip generation.", "1. Automated TempStaff Contract & Payroll Management:"),
        createBulletItem(" Automatic alert system flags upcoming staff retirements at 5-Year, 3-Year, 1-Year, and 6-Month milestones, enabling timely succession planning and exit clearances.", "2. Proactive Retirement Tracking:"),
        createBulletItem(" Standardized digital workflows for drafting, reviewing, and approving letters. Embedded QR codes and verification hashes prevent forgery of official documents.", "3. Verified HR Letter & Document Suite:"),
        createBulletItem(" Complete visibility over system usage through immutable audit trails. Centralized system broadcast announcements across departments.", "4. Centralized Administration & Audit:"),
        
        createHeading1("Security Architecture Overview"),
        createBulletItem(" Enforces strict session cookie checks before allowing page renders.", "Middleware Authentication Guard:"),
        createBulletItem(" Restricts access so users only see authorized modules based on role permissions.", "Granular Access Rights:"),
        createBulletItem(" Tracks system activities for security compliance.", "Audit & Traceability:"),
        createBulletItem(" Embedded QR codes protect issued documents against tampering.", "Data Verification:"),
        
        createHeading1("Access Directory & Credentials"),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({ children: [createBodyPara("Portal Name", { bold: true, color: "FFFFFF" })], shading: { fill: "1F4E78" } }),
                new TableCell({ children: [createBodyPara("System URL", { bold: true, color: "FFFFFF" })], shading: { fill: "1F4E78" } }),
                new TableCell({ children: [createBodyPara("Access Username", { bold: true, color: "FFFFFF" })], shading: { fill: "1F4E78" } }),
                new TableCell({ children: [createBodyPara("Access Password", { bold: true, color: "FFFFFF" })], shading: { fill: "1F4E78" } }),
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ children: [createBodyPara("Super Admin Portal")] }),
                new TableCell({ children: [createBodyPara("[INSERT URL]")] }),
                new TableCell({ children: [createBodyPara("[INSERT USERNAME]")] }),
                new TableCell({ children: [createBodyPara("[INSERT PASSWORD]")] }),
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ children: [createBodyPara("TempStaff Portal")] }),
                new TableCell({ children: [createBodyPara("[INSERT URL]")] }),
                new TableCell({ children: [createBodyPara("[INSERT USERNAME]")] }),
                new TableCell({ children: [createBodyPara("[INSERT PASSWORD]")] }),
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ children: [createBodyPara("Retirement Portal")] }),
                new TableCell({ children: [createBodyPara("[INSERT URL]")] }),
                new TableCell({ children: [createBodyPara("[INSERT USERNAME]")] }),
                new TableCell({ children: [createBodyPara("[INSERT PASSWORD]")] }),
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ children: [createBodyPara("HR Letters Portal")] }),
                new TableCell({ children: [createBodyPara("[INSERT URL]")] }),
                new TableCell({ children: [createBodyPara("[INSERT USERNAME]")] }),
                new TableCell({ children: [createBodyPara("[INSERT PASSWORD]")] }),
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ children: [createBodyPara("Database Server")] }),
                new TableCell({ children: [createBodyPara("[INSERT DB HOST:PORT]")] }),
                new TableCell({ children: [createBodyPara("[INSERT DB USER]")] }),
                new TableCell({ children: [createBodyPara("[INSERT DB PASS]")] }),
              ]
            }),
          ]
        })
      ]
    }]
  });
  return doc;
}

// Generate Email Draft Document
function generateEmailDoc() {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        createTitle("Email Message Draft for Boss"),
        createHeading3("Ready to Copy, Edit, and Send"),
        
        createBodyPara([
          { text: "SUBJECT OPTIONS:\n", bold: true, color: "1F4E78" },
          { text: "Option 1: ", bold: true }, { text: "System Delivery & SRS Documentation: Integrated HR, Payroll & Retirement Suite\n" },
          { text: "Option 2: ", bold: true }, { text: "Final Report & Access Credentials – New Integrated HR System" }
        ]),
        
        createHeading1("Email Body"),
        createBodyPara("Dear [Boss's Name / Title],"),
        createBodyPara("I hope this email finds you well."),
        createBodyPara("I am pleased to share the Software Requirements Specification (SRS), Feature Analysis, and Technical Report for our newly deployed Integrated HR & Workforce Management Suite."),
        createBodyPara("The system brings together our temporary staff operations, retirement tracking, and official HR documentation into a single secure platform."),
        
        createHeading2("Key Highlights of the Delivered Systems:"),
        createBulletItem(" Automated 6-month contract calculations, contract renewal workflows, SSNIT & Petra pension calculations, and instant payslips.", "1. TempStaff Management:"),
        createBulletItem(" Automated retirement milestone alerts (5yrs, 3yrs, 1yr, 6mo) and exit clearance tracking.", "2. Retirement Planning:"),
        createBulletItem(" Templated letter creation with multi-level approvals, digital signatures, and QR code verification to eliminate forgery.", "3. HR Letters & Documentation:"),
        createBulletItem(" Middleware-driven session authentication, Role-Based Access Control (RBAC), and automated audit logs for all system actions.", "4. Security & Auditability:"),

        createHeading2("Access URLs & Login Credentials"),
        createCallout("Fill in your actual portal links, usernames, and passwords before sending.", "FILL-IN DETAILS"),
        
        createBulletItem(" [INSERT PORTAL URL HERE]", "Super Admin Control Portal URL:"),
        createBulletItem(" [INSERT USERNAME HERE]", "Super Admin Username:"),
        createBulletItem(" [INSERT PASSWORD HERE]", "Super Admin Password:"),
        
        createParagraphSpacing(),
        createBulletItem(" [INSERT PORTAL URL HERE]", "TempStaff Portal URL:"),
        createBulletItem(" [INSERT USERNAME HERE]", "TempStaff Username:"),
        createBulletItem(" [INSERT PASSWORD HERE]", "TempStaff Password:"),

        createParagraphSpacing(),
        createBulletItem(" [INSERT PORTAL URL HERE]", "Retirement Portal URL:"),
        createBulletItem(" [INSERT USERNAME HERE]", "Retirement Username:"),
        createBulletItem(" [INSERT PASSWORD HERE]", "Retirement Password:"),

        createParagraphSpacing(),
        createBulletItem(" [INSERT PORTAL URL HERE]", "HR Letters Portal URL:"),
        createBulletItem(" [INSERT USERNAME HERE]", "HR Letters Username:"),
        createBulletItem(" [INSERT PASSWORD HERE]", "HR Letters Password:"),

        createParagraphSpacing(),
        createBulletItem(" [INSERT DB IP & PORT HERE]", "Database Host/Port:"),
        createBulletItem(" [INSERT DB NAME HERE]", "Database Name:"),
        createBulletItem(" [INSERT DB USERNAME HERE]", "DB Username:"),
        createBulletItem(" [INSERT DB PASSWORD HERE]", "DB Password:"),

        createBodyPara("Please let me know if you would like a brief walkthrough of the platform or if you need any adjustments to the access roles."),
        createBodyPara("Best regards,"),
        createBodyPara([
          { text: "[Your Name]\n", bold: true },
          { text: "[Your Job Title]\n" },
          { text: "[Your Contact Information / Department]" }
        ])
      ]
    }]
  });
  return doc;
}

function createParagraphSpacing() {
  return new Paragraph({ spacing: { before: 40, after: 40 } });
}

// Generate Combined Document by creating separate sections for SRS, Report, and Email
async function main() {
  console.log("Generating Word documents...");
  
  const srsDoc = generateSRSDoc();
  const reportDoc = generateReportDoc();
  const emailDoc = generateEmailDoc();

  const srsBuf = await Packer.toBuffer(srsDoc);
  const reportBuf = await Packer.toBuffer(reportDoc);
  const emailBuf = await Packer.toBuffer(emailDoc);

  fs.writeFileSync("1_DVLA_HR_System_SRS_Documentation.docx", srsBuf);
  fs.writeFileSync("2_DVLA_HR_System_Management_Report.docx", reportBuf);
  fs.writeFileSync("3_Email_Draft_for_Boss.docx", emailBuf);

  console.log("Successfully created 3 Word (.docx) documents!");
}

main().catch(console.error);

