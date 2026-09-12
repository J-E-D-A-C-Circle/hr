-- phpMyAdmin SQL Dump
-- version 5.1.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3307
-- Generation Time: Sep 11, 2026 at 02:27 AM
-- Server version: 5.7.24
-- PHP Version: 8.3.1

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
-- Table structure for table `nss_applications`
--

CREATE TABLE `nss_applications` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `nss_number` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `first_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `middle_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date_of_birth` date NOT NULL,
  `gender` enum('Male','Female','Other') COLLATE utf8mb4_unicode_ci NOT NULL,
  `nationality` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone_number` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `residential_address` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `region` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `district` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `institution_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `course_program` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `year_of_completion` year(4) NOT NULL,
  `posting_region` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `posting_district` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `posting_station` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `posting_department` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `service_year` year(4) NOT NULL,
  `service_period_start` date DEFAULT NULL,
  `service_period_end` date DEFAULT NULL,
  `passport_photo` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `id_card_copy` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `appointment_letter` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `certificates` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `additional_info` text COLLATE utf8mb4_unicode_ci,
  `status` enum('pending','under_review','approved','rejected') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `reviewed_by` int(11) DEFAULT NULL,
  `review_notes` text COLLATE utf8mb4_unicode_ci,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `nss_applications`
--

INSERT INTO `nss_applications` (`id`, `user_id`, `nss_number`, `first_name`, `last_name`, `middle_name`, `date_of_birth`, `gender`, `nationality`, `phone_number`, `email`, `residential_address`, `region`, `district`, `institution_name`, `course_program`, `year_of_completion`, `posting_region`, `posting_district`, `posting_station`, `posting_department`, `service_year`, `service_period_start`, `service_period_end`, `passport_photo`, `id_card_copy`, `appointment_letter`, `certificates`, `additional_info`, `status`, `reviewed_by`, `review_notes`, `reviewed_at`, `created_at`, `updated_at`) VALUES
(1, 3, 'NSSYWYWYWTWWTWT', 'Constance', 'Essuman', 'Akua', '2000-01-01', 'Female', 'Ghanaian', '0240767261', 'caessuman3@gmail.com', 'North Legon, Obasanjo street', 'Western North', 'Accra Metro', 'University of Ghana (UG, Legon)', 'BA. History', 2025, 'Greater Accra', 'Accra Metro', 'DOME', 'DTTL', 2026, NULL, NULL, 'passport/3-constance-akua-essuman/1786801230028_wallpaper.png', 'id_card/3-constance-akua-essuman/1786801230264_wallpaper.png', 'appointment/3-constance-akua-essuman/1786801230451_WhatsApp_Image_2026-08-14_at_11.13.32_AM.jpeg', 'cv/3-constance-akua-essuman/1786801230522_Cover_Letter.pdf', NULL, 'approved', 1, 'CONGRATULATIONS', NULL, '2026-08-28 12:46:27', '2026-08-28 12:46:27');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('applicant','admin') COLLATE utf8mb4_unicode_ci DEFAULT 'applicant',
  `full_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `email`, `password_hash`, `role`, `full_name`, `created_at`, `updated_at`) VALUES
(1, 'admin@dvla.gov.gh', '$2b$10$S7lFC4jwFknRMS566CJgwOLxvpK7V4xXbMO7a.iONYrfihcQom1ZC', 'admin', 'System Administrator', '2026-08-28 12:35:46', '2026-08-28 12:35:46'),
(3, 'caessuman3@gmail.com', '$2b$10$S7lFC4jwFknRMS566CJgwOLxvpK7V4xXbMO7a.iONYrfihcQom1ZC', 'applicant', 'Constance Akua Essuman', '2026-08-28 12:46:27', '2026-08-28 12:46:27');

--
-- Indexes for dumped tables
--

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
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `nss_applications`
--
ALTER TABLE `nss_applications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `nss_applications`
--
ALTER TABLE `nss_applications`
  ADD CONSTRAINT `nss_applications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `nss_applications_ibfk_2` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
