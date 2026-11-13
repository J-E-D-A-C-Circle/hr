import {
  mysqlTable,
  varchar,
  text,
  int,
  boolean,
  index,
} from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';

function generateId(): string {
  return randomUUID();
}

// 1. Regions
export const regions = mysqlTable('Region', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => generateId()),
  name: varchar('name', { length: 255 }).notNull().unique(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  createdAt: varchar('createdAt', { length: 50 }).$defaultFn(() => new Date().toISOString()),
  updatedAt: varchar('updatedAt', { length: 50 }).$defaultFn(() => new Date().toISOString()),
});

// 2. Branches
export const branches = mysqlTable(
  'Branch',
  {
    id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => generateId()),
    name: varchar('name', { length: 255 }).notNull().unique(),
    code: varchar('code', { length: 50 }),
    regionId: varchar('regionId', { length: 36 })
      .notNull()
      .references(() => regions.id, { onDelete: 'cascade' }),
    headName: varchar('headName', { length: 255 }),
    headEmail: varchar('headEmail', { length: 255 }),
    active: boolean('active').notNull().default(true),
    createdAt: varchar('createdAt', { length: 50 }).$defaultFn(() => new Date().toISOString()),
    updatedAt: varchar('updatedAt', { length: 50 }).$defaultFn(() => new Date().toISOString()),
  },
  (table) => ({
    regionIdx: index('branch_region_idx').on(table.regionId),
    activeIdx: index('branch_active_idx').on(table.active),
  })
);

// 3. Users
export const users = mysqlTable(
  'User',
  {
    id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => generateId()),
    name: varchar('name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    passwordHash: varchar('passwordHash', { length: 255 }).notNull(),
    role: varchar('role', { length: 50 }).notNull().default('STATION_MANAGER'),
    branchId: varchar('branchId', { length: 36 }).references(() => branches.id, { onDelete: 'set null' }),
    regionId: varchar('regionId', { length: 36 }).references(() => regions.id, { onDelete: 'set null' }),
    active: boolean('active').notNull().default(true),
    createdAt: varchar('createdAt', { length: 50 }).$defaultFn(() => new Date().toISOString()),
    updatedAt: varchar('updatedAt', { length: 50 }).$defaultFn(() => new Date().toISOString()),
  },
  (table) => ({
    branchIdx: index('user_branch_idx').on(table.branchId),
    regionIdx: index('user_region_idx').on(table.regionId),
    roleIdx: index('user_role_idx').on(table.role),
    roleBranchIdx: index('user_role_branch_idx').on(table.role, table.branchId),
    activeIdx: index('user_active_idx').on(table.active),
  })
);

// 4. Submissions
export const submissions = mysqlTable(
  'Submission',
  {
    id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => generateId()),
    branchId: varchar('branchId', { length: 36 })
      .notNull()
      .references(() => branches.id, { onDelete: 'cascade' }),
    month: int('month').notNull(),
    year: int('year').notNull(),
    filePath: varchar('filePath', { length: 500 }).notNull(),
    fileName: varchar('fileName', { length: 255 }).notNull(),
    fileSize: int('fileSize').notNull(),
    note: text('note'),
    uploadedById: varchar('uploadedById', { length: 36 })
      .notNull()
      .references(() => users.id),
    uploadedAt: varchar('uploadedAt', { length: 50 }).$defaultFn(() => new Date().toISOString()),
    status: varchar('status', { length: 50 }).notNull().default('PENDING'),
    reviewerId: varchar('reviewerId', { length: 36 }).references(() => users.id),
    reviewerNotes: text('reviewerNotes'),
    reviewedAt: varchar('reviewedAt', { length: 50 }),
    resubmissionOfId: varchar('resubmissionOfId', { length: 36 }),
    ocrPassed: boolean('ocrPassed').notNull().default(true),
    ocrText: text('ocrText'),
    staffType: varchar('staffType', { length: 50 }).notNull().default('PERMANENT'),
    createdAt: varchar('createdAt', { length: 50 }).$defaultFn(() => new Date().toISOString()),
    updatedAt: varchar('updatedAt', { length: 50 }).$defaultFn(() => new Date().toISOString()),
  },
  (table) => ({
    branchYearMonthIdx: index('sub_branch_ym_idx').on(table.branchId, table.year, table.month),
    branchStatusYmIdx: index('sub_branch_sym_idx').on(table.branchId, table.status, table.year, table.month),
    statusIdx: index('sub_status_idx').on(table.status),
    yearMonthIdx: index('sub_ym_idx').on(table.year, table.month),
    staffTypeIdx: index('sub_staff_type_idx').on(table.staffType),
    uploaderIdx: index('sub_uploader_idx').on(table.uploadedById),
    reviewerIdx: index('sub_reviewer_idx').on(table.reviewerId),
  })
);

// 5. Audit Logs
export const auditLogs = mysqlTable(
  'AuditLog',
  {
    id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => generateId()),
    actorId: varchar('actorId', { length: 36 }).references(() => users.id, { onDelete: 'set null' }),
    action: varchar('action', { length: 100 }).notNull(),
    targetType: varchar('targetType', { length: 100 }).notNull(),
    targetId: varchar('targetId', { length: 36 }),
    timestamp: varchar('timestamp', { length: 50 }).$defaultFn(() => new Date().toISOString()),
    metadata: text('metadata'),
  },
  (table) => ({
    actorIdx: index('audit_actor_idx').on(table.actorId),
    actionIdx: index('audit_action_idx').on(table.action),
    timestampIdx: index('audit_ts_idx').on(table.timestamp),
  })
);

// 6. Deadline Config
export const deadlineConfigs = mysqlTable('DeadlineConfig', {
  id: varchar('id', { length: 50 }).primaryKey().default('default'),
  cutoffDayOfMonth: int('cutoffDayOfMonth').notNull().default(21),
  reminderDaysBefore: int('reminderDaysBefore').notNull().default(3),
  updatedAt: varchar('updatedAt', { length: 50 }).$defaultFn(() => new Date().toISOString()),
});

// 7. Announcements
export const announcements = mysqlTable('Announcement', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => generateId()),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  priority: varchar('priority', { length: 50 }).notNull().default('INFO'),
  active: boolean('active').notNull().default(true),
  author: varchar('author', { length: 255 }).notNull().default('HR Administration'),
  createdAt: varchar('createdAt', { length: 50 }).$defaultFn(() => new Date().toISOString()),
  updatedAt: varchar('updatedAt', { length: 50 }).$defaultFn(() => new Date().toISOString()),
});

// 8. Policy Config
export const policyConfigs = mysqlTable('PolicyConfig', {
  id: varchar('id', { length: 50 }).primaryKey().default('default'),
  maxFileSizeMb: int('maxFileSizeMb').notNull().default(30),
  requireSignature: boolean('requireSignature').notNull().default(true),
  allowedFormats: varchar('allowedFormats', { length: 100 }).notNull().default('PDF'),
  guidelinesText: text('guidelinesText'),
  updatedAt: varchar('updatedAt', { length: 50 }).$defaultFn(() => new Date().toISOString()),
});

// ── RELATIONS ─────────────────────────────────────────────────────────────────
export const regionsRelations = relations(regions, ({ many }) => ({
  branches: many(branches),
  users: many(users),
}));

export const branchesRelations = relations(branches, ({ one, many }) => ({
  region: one(regions, {
    fields: [branches.regionId],
    references: [regions.id],
  }),
  users: many(users),
  submissions: many(submissions),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  branch: one(branches, {
    fields: [users.branchId],
    references: [branches.id],
  }),
  region: one(regions, {
    fields: [users.regionId],
    references: [regions.id],
  }),
  submissionsUploaded: many(submissions, { relationName: 'uploadedBy' }),
  submissionsReviewed: many(submissions, { relationName: 'reviewedBy' }),
  auditLogs: many(auditLogs),
}));

export const submissionsRelations = relations(submissions, ({ one }) => ({
  branch: one(branches, {
    fields: [submissions.branchId],
    references: [branches.id],
  }),
  uploadedBy: one(users, {
    fields: [submissions.uploadedById],
    references: [users.id],
    relationName: 'uploadedBy',
  }),
  reviewer: one(users, {
    fields: [submissions.reviewerId],
    references: [users.id],
    relationName: 'reviewedBy',
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  actor: one(users, {
    fields: [auditLogs.actorId],
    references: [users.id],
  }),
}));

export type Region = typeof regions.$inferSelect;
export type NewRegion = typeof regions.$inferInsert;

export type Branch = typeof branches.$inferSelect;
export type NewBranch = typeof branches.$inferInsert;

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Submission = typeof submissions.$inferSelect;
export type NewSubmission = typeof submissions.$inferInsert;

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;

export type DeadlineConfig = typeof deadlineConfigs.$inferSelect;
export type NewDeadlineConfig = typeof deadlineConfigs.$inferInsert;

export type Announcement = typeof announcements.$inferSelect;
export type NewAnnouncement = typeof announcements.$inferInsert;

export type PolicyConfig = typeof policyConfigs.$inferSelect;
export type NewPolicyConfig = typeof policyConfigs.$inferInsert;
