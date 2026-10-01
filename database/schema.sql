-- DVLA NSS Portal Database Schema
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
    certificates VARCHAR(500),
    
    -- Additional information
    additional_info TEXT,
    
    -- Application status
    status ENUM('draft', 'pending', 'under_review', 'approved', 'rejected') DEFAULT 'pending',
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

-- Insert default admin user (password: admin123)
INSERT INTO users (email, password_hash, role, full_name) 
VALUES ('admin@dvla.gov.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'System Administrator')
ON DUPLICATE KEY UPDATE email=email;

-- Audit Logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    user_name VARCHAR(255) DEFAULT 'System',
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'application',
    entity_id INT NULL,
    details TEXT NULL,
    ip_address VARCHAR(45) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_action (action),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Verification Tokens table
CREATE TABLE IF NOT EXISTS verification_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    phone_number VARCHAR(255) NOT NULL,
    token VARCHAR(10) NOT NULL,
    expires_at DATETIME NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_phone_number (phone_number),
    INDEX idx_token (token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Stations table
CREATE TABLE IF NOT EXISTS stations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    station_code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    region VARCHAR(100) NOT NULL,
    capacity INT NOT NULL DEFAULT 20,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_region (region)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Departments table
CREATE TABLE IF NOT EXISTS departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    station_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (station_id) REFERENCES stations(id) ON DELETE CASCADE,
    UNIQUE KEY idx_station_dept (station_id, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed stations
INSERT INTO stations (id, station_code, name, region, capacity) VALUES
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
ON DUPLICATE KEY UPDATE name = VALUES(name), region = VALUES(region), capacity = VALUES(capacity);

-- Seed departments
INSERT INTO departments (station_id, name) VALUES
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
(11, 'Client Records & Inquiries')
ON DUPLICATE KEY UPDATE name = VALUES(name);

