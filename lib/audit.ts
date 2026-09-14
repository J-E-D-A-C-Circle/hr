import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";

export interface LogAuditParams {
  userName?: string;
  userRole?: string;
  action: string; // e.g. "CREATE", "RENEW", "BULK_RENEW", "TERMINATE", "REINSTATE", "PAYMENT_STATUS_CHANGE"
  details: string;
  staffId?: number | null;
}

export async function logAuditEvent({
  userName,
  userRole = "HR Officer",
  action,
  details,
  staffId = null,
}: LogAuditParams) {
  try {
    let finalUserName = userName;
    let finalUserRole = userRole;

    if (!finalUserName) {
      const session = await getAdminSession();
      finalUserName = session?.name || session?.username || "HR Officer";
      if (session?.role) {
        finalUserRole = session.role;
      }
    }

    await prisma.auditLog.create({
      data: {
        user_name: finalUserName,
        user_role: finalUserRole,
        action,
        details,
        staff_id: staffId ? Number(staffId) : null,
      },
    });
  } catch (error) {
    console.error("Failed to log audit event:", error);
  }
}

