-- Migration script: Add stations and departments tables with seed data

USE dvla_nss_portal;

-- 1. Create stations table
CREATE TABLE IF NOT EXISTS `stations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `station_code` VARCHAR(50) NOT NULL UNIQUE,
  `name` VARCHAR(255) NOT NULL,
  `region` VARCHAR(100) NOT NULL,
  `capacity` INT NOT NULL DEFAULT 20,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_region` (`region`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Create departments table
CREATE TABLE IF NOT EXISTS `departments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `station_id` INT NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`station_id`) REFERENCES `stations` (`id`) ON DELETE CASCADE,
  UNIQUE KEY `idx_station_dept` (`station_id`, `name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Seed stations data
INSERT INTO `stations` (`id`, `station_code`, `name`, `region`, `capacity`) VALUES
(1, 'st-headoffice', 'DVLA Head Office - Cantonments', 'Greater Accra', 50),
(2, 'st-37', 'Accra Regional Office - 37', 'Greater Accra', 35),
(3, 'st-tema', 'Tema Regional Office', 'Greater Accra', 25),
(4, 'st-weija', 'Weija District Office', 'Greater Accra', 20),
(5, 'st-kumasi', 'Kumasi Regional Office - Adum', 'Ashanti', 30),
(6, 'st-takoradi', 'Takoradi Regional Office', 'Western', 20),
(7, 'st-tamale', 'Tamale Regional Office', 'Northern', 15),
(8, 'st-sunyani', 'Sunyani Regional Office', 'Bono', 15),
(9, 'st-capecoast', 'Cape Coast Regional Office', 'Central', 15),
(10, 'st-ho', 'Ho Regional Office', 'Volta', 15),
(11, 'st-koforidua', 'Koforidua Regional Office', 'Eastern', 15)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `region` = VALUES(`region`), `capacity` = VALUES(`capacity`);

-- 4. Seed departments data
INSERT INTO `departments` (`station_id`, `name`) VALUES
-- DVLA Head Office - Cantonments
(1, 'IT & Software Engineering'),
(1, 'Executive Secretariat'),
(1, 'Research & Development'),
(1, 'Administration & Human Resources'),
(1, 'Legal & Compliance'),
(1, 'Finance & Accounting'),
(1, 'Internal Audit'),
(1, 'Procurement & Supply Chain'),
-- Accra Regional Office - 37
(2, 'Driver Licensing & Testing'),
(2, 'Vehicle Inspection & Registration'),
(2, 'Customer Experience & Desk'),
(2, 'Revenue & Cashier'),
-- Tema Regional Office
(3, 'Heavy Vehicle Inspection & Clearance'),
(3, 'Port Transit Clearance'),
(3, 'Driver Licensing'),
(3, 'Customer Service Desk'),
-- Weija District Office
(4, 'Driver Licensing & Renewal'),
(4, 'Vehicle Inspection & Testing'),
(4, 'Client Records & Information'),
-- Kumasi Regional Office - Adum
(5, 'Driver Licensing & Testing'),
(5, 'Vehicle Inspection & Certification'),
(5, 'Regional Administration'),
(5, 'Accounts & Revenue Desk'),
-- Takoradi Regional Office
(6, 'Driver Testing & Certification'),
(6, 'Commercial & Logistics Vehicle Registry'),
(6, 'Client Services & Front Desk'),
-- Tamale Regional Office
(7, 'Driver Licensing & Testing'),
(7, 'Vehicle Inspection & Registration'),
(7, 'Regional Records & Admin'),
-- Sunyani Regional Office
(8, 'Driver Licensing'),
(8, 'Vehicle Inspection'),
(8, 'Customer Service & Cashier'),
-- Cape Coast Regional Office
(9, 'Driver Licensing & Renewal'),
(9, 'Vehicle Inspection & Testing'),
(9, 'Front Desk & Inquiries'),
-- Ho Regional Office
(10, 'Driver Testing & Licensing'),
(10, 'Vehicle Inspection Unit'),
(10, 'Administrative Support'),
-- Koforidua Regional Office
(11, 'Driver Licensing & Testing'),
(11, 'Vehicle Inspection & Registration'),
(11, 'Client Records & Inquiries')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);
