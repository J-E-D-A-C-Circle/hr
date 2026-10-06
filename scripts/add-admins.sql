-- DVLA NSS Portal - Admin Accounts Provisioning Script
-- Auto-generated with bcrypt hashes (password: AdminPass@2026 or custom)

INSERT INTO users (email, password_hash, role, full_name, created_at, updated_at)
VALUES ('hradmin@dvla.gov.gh', '$2b$10$7E.ah7chihHYI2iQV2qiFeA59f42764ibRN1FBl6Gci5SJ9GmzEIC', 'admin', 'DVLA HR Supervisor', NOW(), NOW())
ON DUPLICATE KEY UPDATE role = 'admin', password_hash = '$2b$10$7E.ah7chihHYI2iQV2qiFeA59f42764ibRN1FBl6Gci5SJ9GmzEIC', full_name = 'DVLA HR Supervisor', updated_at = NOW();

INSERT INTO users (email, password_hash, role, full_name, created_at, updated_at)
VALUES ('director@dvla.gov.gh', '$2b$10$hyyAbj3AVQOGzfcPphKNseHAU.9BuY.9/upCWnPjL4uu63IiOkZDK', 'admin', 'DVLA Regional Director', NOW(), NOW())
ON DUPLICATE KEY UPDATE role = 'admin', password_hash = '$2b$10$hyyAbj3AVQOGzfcPphKNseHAU.9BuY.9/upCWnPjL4uu63IiOkZDK', full_name = 'DVLA Regional Director', updated_at = NOW();
