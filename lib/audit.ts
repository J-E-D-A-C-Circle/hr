import { db, auditLogs } from './db';
import crypto from 'crypto';

export async function logAuditAction(params: {
  actorId?: string | null;
  action: string;
  targetType: string;
  targetId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  try {
    const entry = {
      id: crypto.randomUUID(),
      actorId: params.actorId || null,
      action: params.action,
      targetType: params.targetType,
      targetId: params.targetId || null,
      metadata: params.metadata ? JSON.stringify(params.metadata) : null,
      timestamp: new Date().toISOString(),
    };
    await db.insert(auditLogs).values(entry);
    return entry;
  } catch (error) {
    console.error('Failed to write audit log:', error);
    return null;
  }
}
