-- Migration: Update user role from 'nss_personnel' to 'applicant'
-- Run this if you already have a database with 'nss_personnel' role

USE dvla_nss_portal;

-- First, update the ENUM to include 'applicant'
ALTER TABLE users MODIFY COLUMN role ENUM('applicant', 'admin') DEFAULT 'applicant';

-- Update existing records with 'nss_personnel' role to 'applicant'
UPDATE users SET role = 'applicant' WHERE role = 'nss_personnel';

-- Verify the change
SELECT id, email, role FROM users;

