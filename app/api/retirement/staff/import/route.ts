import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { calculateRetirement, validateDateOfBirth } from "@/lib/retirement";
import * as xlsx from "xlsx";

export async function GET() {
  // Download sample template Excel file
  try {
    const templateData = [
      {
        "Staff ID": "DVLA-20001",
        "Full Name": "Kofi Mensah Annan",
        "Date of Birth (YYYY-MM-DD)": "1968-08-14",
        "Gender (Male/Female)": "Male",
        "Department": "Driver Licensing Directorate",
        "Job Title": "Senior Licensing Officer",
        "Grade": "Senior Officer",
        "Date of First Appointment (YYYY-MM-DD)": "1998-03-01",
        "Email": "k.annan@dvla.gov.gh",
        "Phone": "+233 24 000 1122",
      },
      {
        "Staff ID": "DVLA-20002",
        "Full Name": "Ama Serwaa Prempeh",
        "Date of Birth (YYYY-MM-DD)": "1972-11-20",
        "Gender (Male/Female)": "Female",
        "Department": "Human Resource Directorate",
        "Job Title": "HR Officer",
        "Grade": "Officer",
        "Date of First Appointment (YYYY-MM-DD)": "2005-06-15",
        "Email": "a.prempeh@dvla.gov.gh",
        "Phone": "+233 20 111 2233",
      },
    ];

    const worksheet = xlsx.utils.json_to_sheet(templateData);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "DVLA Staff Template");

    const buffer = xlsx.write(workbook, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="DVLA_Retirement_Staff_Import_Template.xlsx"',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to generate template file." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const mode = formData.get("mode") as string; // 'validate' or 'commit'

    if (!file) {
      return NextResponse.json({ error: "No import file uploaded." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const workbook = xlsx.read(Buffer.from(arrayBuffer), { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const rawRows: any[] = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    if (!rawRows || rawRows.length === 0) {
      return NextResponse.json({ error: "The uploaded spreadsheet contains no data rows." }, { status: 400 });
    }

    const existingStaff = await prisma.retirementStaff.findMany({ select: { staffId: true } });
    const existingStaffIds = new Set(existingStaff.map((s) => s.staffId.toUpperCase()));

    const departments = await prisma.retirementDepartment.findMany();
    const deptMap = new Map<string, number>();
    departments.forEach((d) => {
      deptMap.set(d.name.toLowerCase(), d.id);
      deptMap.set(d.code.toLowerCase(), d.id);
    });

    const parsedRecords: any[] = [];
    const validRecords: any[] = [];
    const invalidRecords: any[] = [];
    const seenStaffIdsInFile = new Set<string>();

    for (let index = 0; index < rawRows.length; index++) {
      const row = rawRows[index];
      const rowNum = index + 2; // Row number in Excel (header is 1)

      const rawStaffId = String(row["Staff ID"] || row["staffId"] || row["Staff Code"] || "").trim();
      const rawFullName = String(row["Full Name"] || row["fullName"] || row["Name"] || "").trim();
      const rawDob = row["Date of Birth (YYYY-MM-DD)"] || row["Date of Birth"] || row["dateOfBirth"] || row["DOB"];
      const rawGender = String(row["Gender (Male/Female)"] || row["Gender"] || row["gender"] || "").trim();
      const rawDept = String(row["Department"] || row["departmentName"] || row["Unit"] || "").trim();
      const rawJobTitle = String(row["Job Title"] || row["jobTitle"] || "").trim();
      const rawGrade = String(row["Grade"] || row["grade"] || "").trim();
      const rawDofa = row["Date of First Appointment (YYYY-MM-DD)"] || row["Date of First Appointment"] || row["dateOfFirstAppointment"] || row["DOFA"];
      const rawEmail = String(row["Email"] || row["email"] || "").trim();
      const rawPhone = String(row["Phone"] || row["phone"] || "").trim();

      const errors: string[] = [];

      if (!rawStaffId) errors.push("Missing Staff ID");
      if (!rawFullName) errors.push("Missing Full Name");
      if (!rawDob) errors.push("Missing Date of Birth");
      if (!rawGender) errors.push("Missing Gender");
      if (!rawJobTitle) errors.push("Missing Job Title");

      // Staff ID Duplicate Check
      const upperStaffId = rawStaffId.toUpperCase();
      if (rawStaffId) {
        if (existingStaffIds.has(upperStaffId)) {
          errors.push(`Staff ID '${rawStaffId}' already exists in database`);
        }
        if (seenStaffIdsInFile.has(upperStaffId)) {
          errors.push(`Duplicate Staff ID '${rawStaffId}' in file`);
        } else {
          seenStaffIdsInFile.add(upperStaffId);
        }
      }

      // DOB Validation
      let dobDate: Date | null = null;
      if (rawDob) {
        dobDate = typeof rawDob === "number" ? new Date((rawDob - (25567 + 2)) * 86400 * 1000) : new Date(rawDob);
        if (isNaN(dobDate.getTime())) {
          errors.push("Invalid Date of Birth format");
        } else {
          const v = validateDateOfBirth(dobDate);
          if (!v.valid && v.message) {
            errors.push(v.message);
          }
        }
      }

      // DOFA Validation
      let dofaDate: Date = new Date();
      if (rawDofa) {
        dofaDate = typeof rawDofa === "number" ? new Date((rawDofa - (25567 + 2)) * 86400 * 1000) : new Date(rawDofa);
        if (isNaN(dofaDate.getTime())) {
          dofaDate = new Date();
        }
      }

      let calcResult = null;
      if (dobDate && !isNaN(dobDate.getTime())) {
        calcResult = calculateRetirement(dobDate, dofaDate);
      }

      const deptId = rawDept ? deptMap.get(rawDept.toLowerCase()) || null : null;

      const recordObj = {
        rowNum,
        staffId: rawStaffId,
        fullName: rawFullName,
        dateOfBirth: dobDate,
        dateOfBirthFormatted: dobDate && !isNaN(dobDate.getTime()) ? dobDate.toISOString().split("T")[0] : rawDob,
        gender: rawGender || "Male",
        departmentId: deptId,
        departmentName: rawDept || "General Directorate",
        jobTitle: rawJobTitle,
        grade: rawGrade || "Officer",
        dateOfFirstAppointment: dofaDate,
        email: rawEmail || null,
        phone: rawPhone || null,
        calculation: calcResult,
        errors,
        isValid: errors.length === 0,
      };

      parsedRecords.push(recordObj);
      if (recordObj.isValid) {
        validRecords.push(recordObj);
      } else {
        invalidRecords.push(recordObj);
      }
    }

    if (mode === "commit") {
      if (validRecords.length === 0) {
        return NextResponse.json({ error: "No valid records available to import." }, { status: 400 });
      }

      let importedCount = 0;
      for (const rec of validRecords) {
        await prisma.retirementStaff.create({
          data: {
            staffId: rec.staffId,
            fullName: rec.fullName,
            dateOfBirth: rec.dateOfBirth,
            gender: rec.gender,
            departmentId: rec.departmentId,
            departmentName: rec.departmentName,
            jobTitle: rec.jobTitle,
            grade: rec.grade,
            dateOfFirstAppointment: rec.dateOfFirstAppointment,
            retirementDate: rec.calculation.retirementDate,
            actualRetirementDate: rec.calculation.status === "RETIRED" ? rec.calculation.retirementDate : null,
            retirementStatus: rec.calculation.status,
            email: rec.email,
            phone: rec.phone,
            active: true,
          },
        });
        importedCount++;
      }

      await prisma.retirementAuditLog.create({
        data: {
          userName: "HR Officer",
          userRole: "HR User",
          action: "IMPORT_STAFF",
          details: `Bulk imported ${importedCount} staff records from Excel file '${file.name}'.`,
        },
      });

      return NextResponse.json({
        success: true,
        message: `${importedCount} staff records imported successfully.`,
        importedCount,
      });
    }

    // Default 'validate' preview mode
    return NextResponse.json({
      success: true,
      totalRecords: parsedRecords.length,
      validCount: validRecords.length,
      invalidCount: invalidRecords.length,
      records: parsedRecords,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to process import spreadsheet." }, { status: 500 });
  }
}
