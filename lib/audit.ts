import { db, auditLogs } from './db';

export async function logAuditAction(params: {
  actorId?: string | null;
  action: string;
  targetType: string;
  targetId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  try {
    const inserted = db
      .insert(auditLogs)
      .values({
        actorId: params.actorId || null,
        action: params.action,
        targetType: params.targetType,
        targetId: params.targetId || null,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
      })
      .returning()
      .get();
    return inserted;
  } catch (error) {
    console.error('Failed to write audit log:', error);
    return null;
  }
}
