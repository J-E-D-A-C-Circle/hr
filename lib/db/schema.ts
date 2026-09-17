import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';

function generateId(): string {
  return randomUUID();
}

// 1. Regions
export const regions = sqliteTable('Region', {
  id: text('id').primaryKey().$defaultFn(() => generateId()),
  name: text('name').notNull().unique(),
  code: text('code').notNull().unique(),
  createdAt: text('createdAt').$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updatedAt').$defaultFn(() => new Date().toISOString()),
});

// 2. Branches
export const branches = sqliteTable(
  'Branch',
  {
    id: text('id').primaryKey().$defaultFn(() => generateId()),
    name: text('name').notNull().unique(),
    code: text('code'),
    regionId: text('regionId')
      .notNull()
      .references(() => regions.id, { onDelete: 'cascade' }),
    headName: text('headName'),
    headEmail: text('headEmail'),
    active: integer('active', { mode: 'boolean' }).notNull().default(true),
    createdAt: text('createdAt').$defaultFn(() => new Date().toISOString()),
    updatedAt: text('updatedAt').$defaultFn(() => new Date().toISOString()),
  },
  (table) => ({
    regionIdx: index('branch_region_idx').on(table.regionId),
    activeIdx: index('branch_active_idx').on(table.active),
  })
);

// 3. Users
export const users = sqliteTable(
  'User',
  {
    id: text('id').primaryKey().$defaultFn(() => generateId()),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    passwordHash: text('passwordHash').notNull(),
    role: text('role').notNull().default('STATION_MANAGER'),
    branchId: text('branchId').references(() => branches.id, { onDelete: 'set null' }),
    regionId: text('regionId').references(() => regions.id, { onDelete: 'set null' }),
    active: integer('active', { mode: 'boolean' }).notNull().default(true),
    createdAt: text('createdAt').$defaultFn(() => new Date().toISOString()),
    updatedAt: text('updatedAt').$defaultFn(() => new Date().toISOString()),
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
export const submissions = sqliteTable(
  'Submission',
  {
    id: text('id').primaryKey().$defaultFn(() => generateId()),
    branchId: text('branchId')
      .notNull()
      .references(() => branches.id, { onDelete: 'cascade' }),
    month: integer('month').notNull(),
    year: integer('year').notNull(),
    filePath: text('filePath').notNull(),
    fileName: text('fileName').notNull(),
    fileSize: integer('fileSize').notNull(),
    note: text('note'),
    uploadedById: text('uploadedById')
      .notNull()
      .references(() => users.id),
    uploadedAt: text('uploadedAt').$defaultFn(() => new Date().toISOString()),
    status: text('status').notNull().default('PENDING'),
    reviewerId: text('reviewerId').references(() => users.id),
    reviewerNotes: text('reviewerNotes'),
    reviewedAt: text('reviewedAt'),
    resubmissionOfId: text('resubmissionOfId'),
    ocrPassed: integer('ocrPassed', { mode: 'boolean' }).notNull().default(true),
    ocrText: text('ocrText'),
    staffType: text('staffType').notNull().default('PERMANENT'),
    createdAt: text('createdAt').$defaultFn(() => new Date().toISOString()),
    updatedAt: text('updatedAt').$defaultFn(() => new Date().toISOString()),
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
export const auditLogs = sqliteTable(
  'AuditLog',
  {
    id: text('id').primaryKey().$defaultFn(() => generateId()),
    actorId: text('actorId').references(() => users.id, { onDelete: 'set null' }),
    action: text('action').notNull(),
    targetType: text('targetType').notNull(),
    targetId: text('targetId'),
    timestamp: text('timestamp').$defaultFn(() => new Date().toISOString()),
    metadata: text('metadata'),
  },
  (table) => ({
    actorIdx: index('audit_actor_idx').on(table.actorId),
    actionIdx: index('audit_action_idx').on(table.action),
    timestampIdx: index('audit_ts_idx').on(table.timestamp),
  })
);

// 6. Deadline Config
export const deadlineConfigs = sqliteTable('DeadlineConfig', {
  id: text('id').primaryKey().default('default'),
  cutoffDayOfMonth: integer('cutoffDayOfMonth').notNull().default(21),
  reminderDaysBefore: integer('reminderDaysBefore').notNull().default(3),
  updatedAt: text('updatedAt').$defaultFn(() => new Date().toISOString()),
});

// 7. Announcements
export const announcements = sqliteTable('Announcement', {
  id: text('id').primaryKey().$defaultFn(() => generateId()),
  title: text('title').notNull(),
  content: text('content').notNull(),
  priority: text('priority').notNull().default('INFO'),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  author: text('author').notNull().default('HR Administration'),
  createdAt: text('createdAt').$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updatedAt').$defaultFn(() => new Date().toISOString()),
});

// 8. Policy Config
export const policyConfigs = sqliteTable('PolicyConfig', {
  id: text('id').primaryKey().default('default'),
  maxFileSizeMb: integer('maxFileSizeMb').notNull().default(30),
  requireSignature: integer('requireSignature', { mode: 'boolean' }).notNull().default(true),
  allowedFormats: text('allowedFormats').notNull().default('PDF'),
  guidelinesText: text('guidelinesText')
    .notNull()
    .default(
      'All monthly payroll validation documents must be signed by the Station Manager and uploaded in PDF format prior to the 21st monthly cutoff.'
    ),
  updatedAt: text('updatedAt').$defaultFn(() => new Date().toISOString()),
});

// --- Drizzle Relations ---

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
  submissionsUploaded: many(submissions, { relationName: 'UploadedBy' }),
  submissionsReviewed: many(submissions, { relationName: 'ReviewedBy' }),
  auditLogs: many(auditLogs),
}));

export const submissionsRelations = relations(submissions, ({ one, many }) => ({
  branch: one(branches, {
    fields: [submissions.branchId],
    references: [branches.id],
  }),
  uploadedBy: one(users, {
    fields: [submissions.uploadedById],
    references: [users.id],
    relationName: 'UploadedBy',
  }),
  reviewer: one(users, {
    fields: [submissions.reviewerId],
    references: [users.id],
    relationName: 'ReviewedBy',
  }),
  resubmissionOf: one(submissions, {
    fields: [submissions.resubmissionOfId],
    references: [submissions.id],
    relationName: 'Resubmissions',
  }),
  priorSubmissions: many(submissions, { relationName: 'Resubmissions' }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  actor: one(users, {
    fields: [auditLogs.actorId],
    references: [users.id],
  }),
}));
