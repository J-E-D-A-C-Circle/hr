import {
  mysqlTable,
  int,
  varchar,
  text,
  timestamp,
  date,
  year,
  boolean,
  mysqlEnum,
  index,
} from 'drizzle-orm/mysql-core';

export const users = mysqlTable('users', {
  id: int('id').primaryKey().autoincrement(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  role: mysqlEnum('role', ['applicant', 'admin']).default('applicant').notNull(),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const nssApplications = mysqlTable('nss_applications', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  nssNumber: varchar('nss_number', { length: 100 }).unique(),
  firstName: varchar('first_name', { length: 255 }).notNull(),
  lastName: varchar('last_name', { length: 255 }).notNull(),
  middleName: varchar('middle_name', { length: 255 }),
  dateOfBirth: date('date_of_birth', { mode: 'string' }).notNull(),
  gender: mysqlEnum('gender', ['Male', 'Female', 'Other']).notNull(),
  nationality: varchar('nationality', { length: 100 }).notNull(),
  phoneNumber: varchar('phone_number', { length: 20 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  residentialAddress: text('residential_address').notNull(),
  region: varchar('region', { length: 100 }).notNull(),
  district: varchar('district', { length: 100 }).notNull(),
  
  institutionName: varchar('institution_name', { length: 255 }).notNull(),
  courseProgram: varchar('course_program', { length: 255 }).notNull(),
  yearOfCompletion: year('year_of_completion').notNull(),
  
  postingRegion: varchar('posting_region', { length: 100 }),
  postingDistrict: varchar('posting_district', { length: 100 }),
  postingStation: varchar('posting_station', { length: 255 }),
  postingDepartment: varchar('posting_department', { length: 255 }),
  serviceYear: year('service_year').notNull(),
  servicePeriodStart: date('service_period_start', { mode: 'string' }),
  servicePeriodEnd: date('service_period_end', { mode: 'string' }),
  
  passportPhoto: varchar('passport_photo', { length: 255 }),
  idCardCopy: varchar('id_card_copy', { length: 255 }),
  appointmentLetter: varchar('appointment_letter', { length: 255 }),
  certificates: varchar('certificates', { length: 500 }),
  
  additionalInfo: text('additional_info'),
  
  status: mysqlEnum('status', ['pending', 'under_review', 'approved', 'rejected']).default('pending'),
  reviewedBy: int('reviewed_by').references(() => users.id, { onDelete: 'set null' }),
  reviewNotes: text('review_notes'),
  reviewedAt: timestamp('reviewed_at'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
}, (table) => {
  return {
    statusIdx: index('idx_status').on(table.status),
    userIdx: index('idx_user_id').on(table.userId),
    nssNumberIdx: index('idx_nss_number').on(table.nssNumber),
  };
});

export const verificationTokens = mysqlTable('verification_tokens', {
  id: int('id').primaryKey().autoincrement(),
  phoneNumber: varchar('phone_number', { length: 20 }).notNull(),
  token: varchar('token', { length: 10 }).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  isUsed: boolean('is_used').default(false),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => {
  return {
    phoneNumberIdx: index('idx_phone_number').on(table.phoneNumber),
    tokenIdx: index('idx_token').on(table.token),
  };
});

export const auditLogs = mysqlTable('audit_logs', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('user_id').references(() => users.id, { onDelete: 'set null' }),
  userName: varchar('user_name', { length: 255 }).default('System'),
  action: varchar('action', { length: 100 }).notNull(),
  entityType: varchar('entity_type', { length: 50 }).default('application'),
  entityId: int('entity_id'),
  details: text('details'),
  ipAddress: varchar('ip_address', { length: 45 }),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => {
  return {
    actionIdx: index('idx_action').on(table.action),
    createdAtIdx: index('idx_created_at').on(table.createdAt),
  };
});
