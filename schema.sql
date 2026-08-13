-- SQL Schema for Temporary Staff Contract Management System
-- Suitable for phpMyAdmin / MySQL database setup

CREATE TABLE IF NOT EXISTS staff (
  id INT AUTO_INCREMENT PRIMARY KEY,
  staff_code VARCHAR(50) UNIQUE,          -- existing ID/employee number from Excel
  full_name VARCHAR(150) NOT NULL,
  date_of_birth DATETIME NULL,
  gender VARCHAR(20) NULL,
  email VARCHAR(150) NULL,
  role VARCHAR(100),
  department VARCHAR(100),
  phone VARCHAR(30),
  bank_name VARCHAR(100),
  bank_branch VARCHAR(100) NULL,
  bank_account VARCHAR(50),
  salary DECIMAL(10,2),
  insurance_provider VARCHAR(50) DEFAULT 'Petra',
  insurance_policy_no VARCHAR(50),
  insurance_premium DECIMAL(10,2),
  payment_status VARCHAR(50) DEFAULT 'paid', -- 'paid' or 'unpaid' / on hold
  unpaid_reason VARCHAR(255) NULL,
  ssnit_no VARCHAR(50) NULL,
  nia_number VARCHAR(50) NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS contracts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  staff_id INT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,                 -- start_date + 6 months, computed on insert
  renewal_number INT DEFAULT 1,           -- 1 = original, 2 = first renewal, etc.
  is_terminated BOOLEAN DEFAULT FALSE,
  termination_date DATE NULL,
  termination_reason VARCHAR(255) NULL,
  is_current BOOLEAN DEFAULT TRUE,        -- only one current contract per staff_id
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS deduction_settings (
  id INT PRIMARY KEY DEFAULT 1,
  ssnit_employee_rate DECIMAL(5,2) DEFAULT 5.50,  -- 5.5% SSNIT Employee Tier 1
  ssnit_employer_rate DECIMAL(5,2) DEFAULT 13.00, -- 13.0% SSNIT Employer Tier 1
  petra_employee_rate DECIMAL(5,2) DEFAULT 5.00,  -- 5.0% Petra Tier 3 Employee
  petra_employer_rate DECIMAL(5,2) DEFAULT 5.00,  -- 5.0% Petra Tier 3 Employer
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS staff_validations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  staff_id INT NOT NULL,
  month VARCHAR(50) NOT NULL,
  validated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  validated_by VARCHAR(100) DEFAULT 'Admin',
  notes VARCHAR(255) NULL,
  FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE,
  UNIQUE KEY unique_staff_month (staff_id, month)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_name VARCHAR(100) DEFAULT 'HR Admin',
  user_role VARCHAR(100) DEFAULT 'HR Manager',
  action VARCHAR(50) NOT NULL,
  details TEXT NOT NULL,
  staff_id INT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

