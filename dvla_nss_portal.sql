-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: db
-- Generation Time: Oct 01, 2026 at 02:49 PM
-- Server version: 8.0.46
-- PHP Version: 8.3.26

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `dvla_nss_portal`
--

-- --------------------------------------------------------

--
-- Table structure for table `audit_logs`
--

CREATE TABLE `audit_logs` (
  `id` int NOT NULL,
  `user_id` int DEFAULT NULL,
  `user_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'System',
  `action` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'application',
  `entity_id` int DEFAULT NULL,
  `details` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `ip_address` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `nss_applications`
--

CREATE TABLE `nss_applications` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `nss_number` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `first_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `middle_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date_of_birth` date NOT NULL,
  `gender` enum('Male','Female','Other') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nationality` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone_number` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `residential_address` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `region` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `district` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `institution_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `course_program` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `year_of_completion` year NOT NULL,
  `posting_region` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `posting_district` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `posting_station` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `posting_department` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `service_year` year NOT NULL,
  `service_period_start` date DEFAULT NULL,
  `service_period_end` date DEFAULT NULL,
  `passport_photo` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `id_card_copy` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `appointment_letter` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `certificates` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `additional_info` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `status` enum('pending','under_review','approved','rejected') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `reviewed_by` int DEFAULT NULL,
  `review_notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `nss_applications`
--

INSERT INTO `nss_applications` (`id`, `user_id`, `nss_number`, `first_name`, `last_name`, `middle_name`, `date_of_birth`, `gender`, `nationality`, `phone_number`, `email`, `residential_address`, `region`, `district`, `institution_name`, `course_program`, `year_of_completion`, `posting_region`, `posting_district`, `posting_station`, `posting_department`, `service_year`, `service_period_start`, `service_period_end`, `passport_photo`, `id_card_copy`, `appointment_letter`, `certificates`, `additional_info`, `status`, `reviewed_by`, `review_notes`, `reviewed_at`, `created_at`, `updated_at`) VALUES
(1, 3, 'NSSYWYWYWTWWTWT', 'Constance', 'Essuman', 'Akua', '2000-01-01', 'Female', 'Ghanaian', '0240767261', 'caessuman3@gmail.com', 'North Legon, Obasanjo street', 'Western North', 'Accra Metro', 'University of Ghana (UG, Legon)', 'BA. History', '2025', 'Greater Accra', 'Accra Metro', 'DOME', 'DTTL', '2026', NULL, NULL, 'passport/3-constance-akua-essuman/1786801230028_wallpaper.png', 'id_card/3-constance-akua-essuman/1786801230264_wallpaper.png', 'appointment/3-constance-akua-essuman/1786801230451_WhatsApp_Image_2026-08-14_at_11.13.32_AM.jpeg', 'cv/3-constance-akua-essuman/1786801230522_Cover_Letter.pdf', NULL, 'approved', 1, 'CONGRATULATIONS', '2026-09-12 05:41:33', '2026-08-28 12:46:27', '2026-09-12 05:41:33');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int NOT NULL,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('applicant','admin') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'applicant',
  `full_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `email`, `password_hash`, `role`, `full_name`, `created_at`, `updated_at`) VALUES
(1, 'admin@dvla.gov.gh', '$2b$10$S7lFC4jwFknRMS566CJgwOLxvpK7V4xXbMO7a.iONYrfihcQom1ZC', 'admin', 'System Administrator', '2026-08-28 12:35:46', '2026-08-28 12:35:46'),
(3, 'caessuman3@gmail.com', '$2b$10$dl6fJi9ZmqWct3XfrH6k.eLwIVpEeMYlwnLLTtEUXlOUIXR9TKbUC', 'applicant', 'Constance Akua Essuman', '2026-08-28 12:46:27', '2026-09-12 05:42:22'),
(4, 'constance6594@gmail.com', '$2b$10$jfLjwUqcdp281btGUCjPn.Kfg5BkwTr68KTAkjPWASaqTrKmILto.', 'applicant', 'Constance Akua Essuman', '2026-09-30 14:26:00', '2026-09-30 14:26:00');

-- --------------------------------------------------------

--
-- Table structure for table `verification_tokens`
--

CREATE TABLE `verification_tokens` (
  `id` int NOT NULL,
  `phone_number` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_used` tinyint(1) DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `idx_action` (`action`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `nss_applications`
--
ALTER TABLE `nss_applications`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nss_number` (`nss_number`),
  ADD KEY `reviewed_by` (`reviewed_by`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_nss_number` (`nss_number`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `verification_tokens`
--
ALTER TABLE `verification_tokens`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_phone_number` (`phone_number`),
  ADD KEY `idx_token` (`token`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `audit_logs`
--
ALTER TABLE `audit_logs`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `nss_applications`
--
ALTER TABLE `nss_applications`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `verification_tokens`
--
ALTER TABLE `verification_tokens`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD CONSTRAINT `audit_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `nss_applications`
--
ALTER TABLE `nss_applications`
  ADD CONSTRAINT `nss_applications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `nss_applications_ibfk_2` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

-- --------------------------------------------------------

--
-- Table structure for table `stations`
--

CREATE TABLE `stations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `station_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL UNIQUE,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `region` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `capacity` int NOT NULL DEFAULT '20',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_region` (`region`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `stations`
--

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
(11, 'st-koforidua', 'Koforidua Regional Office', 'Eastern', 15);

-- --------------------------------------------------------

--
-- Table structure for table `departments`
--

CREATE TABLE `departments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `station_id` int NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_station_dept` (`station_id`, `name`),
  KEY `station_id` (`station_id`),
  CONSTRAINT `departments_ibfk_1` FOREIGN KEY (`station_id`) REFERENCES `stations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `departments`
--

INSERT INTO `departments` (`station_id`, `name`) VALUES
(1, 'IT & Software Engineering'),
(1, 'Executive Secretariat'),
(1, 'Research & Development'),
(1, 'Administration & Human Resources'),
(1, 'Legal & Compliance'),
(1, 'Finance & Accounting'),
(1, 'Internal Audit'),
(1, 'Procurement & Supply Chain'),
(2, 'Driver Licensing & Testing'),
(2, 'Vehicle Inspection & Registration'),
(2, 'Customer Experience & Desk'),
(2, 'Revenue & Cashier'),
(3, 'Heavy Vehicle Inspection & Clearance'),
(3, 'Port Transit Clearance'),
(3, 'Driver Licensing'),
(3, 'Customer Service Desk'),
(4, 'Driver Licensing & Renewal'),
(4, 'Vehicle Inspection & Testing'),
(4, 'Client Records & Information'),
(5, 'Driver Licensing & Testing'),
(5, 'Vehicle Inspection & Certification'),
(5, 'Regional Administration'),
(5, 'Accounts & Revenue Desk'),
(6, 'Driver Testing & Certification'),
(6, 'Commercial & Logistics Vehicle Registry'),
(6, 'Client Services & Front Desk'),
(7, 'Driver Licensing & Testing'),
(7, 'Vehicle Inspection & Registration'),
(7, 'Regional Records & Admin'),
(8, 'Driver Licensing'),
(8, 'Vehicle Inspection'),
(8, 'Customer Service & Cashier'),
(9, 'Driver Licensing & Renewal'),
(9, 'Vehicle Inspection & Testing'),
(9, 'Front Desk & Inquiries'),
(10, 'Driver Testing & Licensing'),
(10, 'Vehicle Inspection Unit'),
(10, 'Administrative Support'),
(11, 'Driver Licensing & Testing'),
(11, 'Vehicle Inspection & Registration'),
(11, 'Client Records & Inquiries');

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

