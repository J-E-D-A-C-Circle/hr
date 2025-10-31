-- DVLA NSS Portal Database Schema
-- Create database
CREATE DATABASE IF NOT EXISTS dvla_nss_portal CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE dvla_nss_portal;

-- Users table (for login - NSS personnel and admins)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('applicant', 'admin') DEFAULT 'applicant',
    full_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- NSS Personnel Applications table
CREATE TABLE IF NOT EXISTS nss_applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    nss_number VARCHAR(100) UNIQUE,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    middle_name VARCHAR(255),
    date_of_birth DATE NOT NULL,
    gender ENUM('Male', 'Female', 'Other') NOT NULL,
    nationality VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL,
    residential_address TEXT NOT NULL,
    region VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    
    -- Educational details
    institution_name VARCHAR(255) NOT NULL,
    course_program VARCHAR(255) NOT NULL,
    year_of_completion YEAR NOT NULL,
    
    -- NSS Assignment details
    posting_region VARCHAR(100),
    posting_district VARCHAR(100),
    posting_station VARCHAR(255),
    posting_department VARCHAR(255),
    service_year YEAR NOT NULL,
    service_period_start DATE,
    service_period_end DATE,
    
    -- Documents (file paths)
    passport_photo VARCHAR(255),
    id_card_copy VARCHAR(255),
    appointment_letter VARCHAR(255),
    certificates VARCHAR(500), -- Used for CV
    
    -- Additional information
    additional_info TEXT,
    
    -- Application status
    status ENUM('pending', 'under_review', 'approved', 'rejected') DEFAULT 'pending',
    reviewed_by INT NULL,
    review_notes TEXT,
    reviewed_at TIMESTAMP NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_status (status),
    INDEX idx_user_id (user_id),
    INDEX idx_nss_number (nss_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default admin user (password: admin123 - change this in production!)
-- Password hash for 'admin123' using bcrypt
INSERT INTO users (email, password_hash, role, full_name) 
VALUES ('admin@dvla.gov.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'System Administrator')
ON DUPLICATE KEY UPDATE email=email;

