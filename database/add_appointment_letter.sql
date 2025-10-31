-- Add appointment_letter column if it doesn't exist
-- CV can use the certificates field

USE dvla_nss_portal;

ALTER TABLE nss_applications 
ADD COLUMN IF NOT EXISTS appointment_letter VARCHAR(255) NULL AFTER id_card_copy;

-- If IF NOT EXISTS doesn't work, use:
-- ALTER TABLE nss_applications ADD COLUMN appointment_letter VARCHAR(255) NULL AFTER id_card_copy;

