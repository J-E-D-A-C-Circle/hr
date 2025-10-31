-- Migration: Add posting_station and posting_department columns to nss_applications table
-- Run this if you have an existing database

USE dvla_nss_portal;

-- Add posting_station column if it doesn't exist
ALTER TABLE nss_applications 
ADD COLUMN IF NOT EXISTS posting_station VARCHAR(255) NULL AFTER posting_district;

-- Add posting_department column if it doesn't exist
ALTER TABLE nss_applications 
ADD COLUMN IF NOT EXISTS posting_department VARCHAR(255) NULL AFTER posting_station;

-- Note: IF NOT EXISTS syntax may not work in all MySQL versions
-- If you get an error, remove "IF NOT EXISTS" and run:
-- ALTER TABLE nss_applications ADD COLUMN posting_station VARCHAR(255) NULL AFTER posting_district;
-- ALTER TABLE nss_applications ADD COLUMN posting_department VARCHAR(255) NULL AFTER posting_station;

