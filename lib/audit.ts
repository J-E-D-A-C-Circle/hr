import { prisma } from "@/lib/db";

export interface LogAuditParams {
  userName?: string;
  userRole?: string;
  action: string; // e.g. "CREATE", "RENEW", "BULK_RENEW", "TERMINATE", "REINSTATE", "PAYMENT_STATUS_CHANGE"
  details: string;
  staffId?: number | null;
}

export async function logAuditEvent({
  userName = "HR Admin",
  userRole = "HR Manager",
  action,
  details,
  staffId = null,
}: LogAuditParams) {
  try {
    await prisma.auditLog.create({
      data: {
        user_name: userName,
        user_role: userRole,
        action,
        details,
        staff_id: staffId ? Number(staffId) : null,
      },
    });
  } catch (error) {
    console.error("Failed to log audit event:", error);
  }
}
