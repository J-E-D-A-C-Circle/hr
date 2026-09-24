-- =============================================================================
-- DVLA RETIREMENT SYSTEM - STANDALONE SQL SCHEMA
-- Target Database: tempstaff_db (MySQL 8.0+)
-- =============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. RETIREMENT DEPARTMENTS & REGIONAL STATIONS
CREATE TABLE IF NOT EXISTS `retirement_departments` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `type` VARCHAR(191) NOT NULL DEFAULT 'DEPARTMENT', -- DEPARTMENT, STATION
  `location` VARCHAR(191) DEFAULT 'Head Office, Accra',
  `headOfDept` VARCHAR(191) DEFAULT NULL,
  `description` VARCHAR(191) DEFAULT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `retirement_departments_code_key` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. RETIREMENT STAFF DIRECTORY
CREATE TABLE IF NOT EXISTS `retirement_staff` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `staffId` VARCHAR(191) NOT NULL,
  `fullName` VARCHAR(191) NOT NULL,
  `dateOfBirth` DATETIME(3) NOT NULL,
  `gender` VARCHAR(191) NOT NULL,
  `departmentId` INT DEFAULT NULL,
  `departmentName` VARCHAR(191) DEFAULT NULL,
  `stationName` VARCHAR(191) DEFAULT NULL,
  `jobTitle` VARCHAR(191) NOT NULL,
  `grade` VARCHAR(191) DEFAULT NULL,
  `dateOfFirstAppointment` DATETIME(3) NOT NULL,
  `retirementDate` DATETIME(3) NOT NULL,
  `actualRetirementDate` DATETIME(3) DEFAULT NULL,
  `retirementStatus` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, NEARING_RETIREMENT, DUE_THIS_YEAR, RETIRED
  `email` VARCHAR(191) DEFAULT NULL,
  `phone` VARCHAR(191) DEFAULT NULL,
  `active` TINYINT(1) NOT NULL DEFAULT '1',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `retirement_staff_staffId_key` (`staffId`),
  KEY `retirement_staff_departmentId_fkey` (`departmentId`),
  CONSTRAINT `retirement_staff_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `retirement_departments` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. RETIREMENT USERS
CREATE TABLE IF NOT EXISTS `retirement_users` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(191) NOT NULL,
  `fullName` VARCHAR(191) NOT NULL,
  `username` VARCHAR(191) NOT NULL,
  `passwordHash` VARCHAR(191) NOT NULL,
  `role` VARCHAR(191) NOT NULL DEFAULT 'HR_OFFICER', -- HR_ADMINISTRATOR, HR_OFFICER
  `active` TINYINT(1) NOT NULL DEFAULT '1',
  `lastLogin` DATETIME(3) DEFAULT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `retirement_users_email_key` (`email`),
  UNIQUE KEY `retirement_users_username_key` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. MILESTONE ALERTS
CREATE TABLE IF NOT EXISTS `retirement_alerts` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `staffId` INT NOT NULL,
  `milestone` VARCHAR(191) NOT NULL, -- 5_YEARS, 3_YEARS, 1_YEAR, 6_MONTHS
  `triggeredAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `status` VARCHAR(191) NOT NULL DEFAULT 'UNREAD', -- UNREAD, READ, ACKNOWLEDGED
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `retirement_alerts_staffId_milestone_key` (`staffId`, `milestone`),
  CONSTRAINT `retirement_alerts_staffId_fkey` FOREIGN KEY (`staffId`) REFERENCES `retirement_staff` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. AUDIT LOGS
CREATE TABLE IF NOT EXISTS `retirement_audit_logs` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `userName` VARCHAR(191) NOT NULL,
  `userRole` VARCHAR(191) NOT NULL,
  `action` VARCHAR(191) NOT NULL,
  `details` VARCHAR(191) NOT NULL,
  `staffId` INT DEFAULT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. SETTINGS
CREATE TABLE IF NOT EXISTS `retirement_settings` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `key` VARCHAR(191) NOT NULL,
  `value` VARCHAR(191) NOT NULL,
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `retirement_settings_key_key` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. GRADES
CREATE TABLE IF NOT EXISTS `retirement_grades` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `gradeName` VARCHAR(191) NOT NULL,
  `pensionFactor` DOUBLE NOT NULL DEFAULT '1',
  `description` VARCHAR(191) DEFAULT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `retirement_grades_gradeName_key` (`gradeName`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. CLEARANCE ITEMS
CREATE TABLE IF NOT EXISTS `clearance_items` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(191) NOT NULL,
  `description` VARCHAR(191) DEFAULT NULL,
  `requiredDept` VARCHAR(191) NOT NULL,
  `order` INT NOT NULL DEFAULT '1',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
