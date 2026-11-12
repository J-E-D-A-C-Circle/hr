-- Idempotent Data Cleaning & Station Mapping Migration
-- Cleans typos and redundant suffixes in staff.department WITHOUT overwriting sub-units
-- (e.g. HEAD OFFICE PME, HEAD OFFICE IT, GREATER ACCRA STORES, ADENTAN OFFICE(COMPLIANCE)
-- are preserved in the DB and grouped under their parent official station in the app).

UPDATE `staff` SET `department` = TRIM(REGEXP_REPLACE(`department`, '[[:space:]]+', ' ')) WHERE `department` IS NOT NULL;

-- Greater Accra / Narmah / Haatso (preserves GREATER ACCRA STORES & LA PLASPACK)
UPDATE `staff` SET `department` = 'NARMAH/HAATSO/ACCRA OFFICE'
WHERE UPPER(TRIM(`department`)) IN (
  'GREATER ACCRA',
  'GREATER ACCRA REGIONAL OFFICE'
);

-- Regional & District Offices (preserves ADENTAN OFFICE(COMPLIANCE))
UPDATE `staff` SET `department` = 'ADENTAN'
WHERE UPPER(TRIM(`department`)) IN ('ADENTAN OFFICE', 'ADENTA');

UPDATE `staff` SET `department` = 'WEIJA'
WHERE UPPER(TRIM(`department`)) = 'WEIJA OFFICE';

UPDATE `staff` SET `department` = 'KUMASI'
WHERE UPPER(TRIM(`department`)) = 'KUMASI OFFICE';

UPDATE `staff` SET `department` = 'TEMA'
WHERE UPPER(TRIM(`department`)) IN ('TEMA OFFICE', 'TEMA HABOUR', 'TEMA HARBOUR');

UPDATE `staff` SET `department` = 'SUNYANI'
WHERE UPPER(TRIM(`department`)) = 'SUNYANI OFFICE';

UPDATE `staff` SET `department` = 'BECHEM'
WHERE UPPER(TRIM(`department`)) = 'BECHEM OFFICE';

UPDATE `staff` SET `department` = 'TAMALE'
WHERE UPPER(TRIM(`department`)) = 'TAMALE OFFICE';

UPDATE `staff` SET `department` = 'WINNEBA'
WHERE UPPER(TRIM(`department`)) = 'WINNEBA OFFICE';

UPDATE `staff` SET `department` = 'DORMAA'
WHERE UPPER(TRIM(`department`)) = 'DORMAA AHENKRO';

UPDATE `staff` SET `department` = 'WA'
WHERE UPPER(TRIM(`department`)) = 'WA OFFICE';

UPDATE `staff` SET `department` = 'CAPE-COAST'
WHERE UPPER(TRIM(`department`)) = 'CAPE COAST';

UPDATE `staff` SET `department` = 'HO'
WHERE UPPER(TRIM(`department`)) = 'HO OFFICE';

UPDATE `staff` SET `department` = 'NKORANZA OFFICE'
WHERE UPPER(TRIM(`department`)) = 'NKORANZA';

UPDATE `staff` SET `department` = 'AKWATIA'
WHERE UPPER(TRIM(`department`)) = 'AKWATIA OFFICE';

UPDATE `staff` SET `department` = 'TUMU OFFICE'
WHERE UPPER(TRIM(`department`)) = 'TUMU';

UPDATE `staff` SET `department` = 'HOHOE'
WHERE UPPER(TRIM(`department`)) = 'HOHOE OFFICE';

UPDATE `staff` SET `department` = 'TECHIMAN'
WHERE UPPER(TRIM(`department`)) = 'TECHIMAN OFFICE';

UPDATE `staff` SET `department` = 'NAVRONGO OFFICE'
WHERE UPPER(TRIM(`department`)) = 'NAVRONGO';

UPDATE `staff` SET `department` = 'SALAGA OFFICE'
WHERE UPPER(TRIM(`department`)) = 'SALAGA';

UPDATE `staff` SET `department` = 'TAKORADI'
WHERE UPPER(TRIM(`department`)) = 'TAKORADI OFFICE';

UPDATE `staff` SET `department` = 'AXIM'
WHERE UPPER(TRIM(`department`)) = 'AXIM OFFICE';

UPDATE `staff` SET `department` = 'AGONA-ASHANTI'
WHERE UPPER(TRIM(`department`)) IN ('AGONA OFFICE', 'AGONA');

UPDATE `staff` SET `department` = 'GOASO'
WHERE UPPER(TRIM(`department`)) = 'GOASO OFFICE';

UPDATE `staff` SET `department` = 'YENDI OFFICE'
WHERE UPPER(TRIM(`department`)) = 'YENDI';

UPDATE `staff` SET `department` = 'KOFORIDUA'
WHERE UPPER(TRIM(`department`)) = 'KOFORIDUA OFFICE';

UPDATE `staff` SET `department` = 'DENU'
WHERE UPPER(TRIM(`department`)) = 'DENU OFFICE';

UPDATE `staff` SET `department` = 'MAMPONG ASHANTI'
WHERE UPPER(TRIM(`department`)) = 'MAMPONG OFFICE';

UPDATE `staff` SET `department` = 'AKATSI'
WHERE UPPER(TRIM(`department`)) = 'AKATSI OFFICE';

UPDATE `staff` SET `department` = 'TARKWA'
WHERE UPPER(TRIM(`department`)) = 'TARKWA OFFICE';

UPDATE `staff` SET `department` = 'NALERIGU OFFICE'
WHERE UPPER(TRIM(`department`)) = 'NALERIGU';

UPDATE `staff` SET `department` = 'OBUASI'
WHERE UPPER(TRIM(`department`)) = 'OBUASI OFFICE';

UPDATE `staff` SET `department` = 'WENCHI'
WHERE UPPER(TRIM(`department`)) = 'WENCHI OFFICE';

UPDATE `staff` SET `department` = 'ASUOGYAMAN OFFICE'
WHERE UPPER(TRIM(`department`)) = 'ASUOGYAMAN';

UPDATE `staff` SET `department` = 'DUNKWA-ON-OFFIN'
WHERE UPPER(TRIM(`department`)) = 'DUNKWA';

-- Ultra Offices
UPDATE `staff` SET `department` = 'CIRCLE'
WHERE UPPER(TRIM(`department`)) = 'CIRCLE OFFICE';

UPDATE `staff` SET `department` = 'BUEM-JASIKAN'
WHERE UPPER(TRIM(`department`)) = 'BUEM';

UPDATE `staff` SET `department` = 'AMRAHIA'
WHERE UPPER(TRIM(`department`)) = 'AMRAHIA ULTRA CENTRE';

UPDATE `staff` SET `department` = 'ANYAA'
WHERE UPPER(TRIM(`department`)) = 'ANYAA ULTRA';

UPDATE `staff` SET `department` = 'NSAWAM'
WHERE UPPER(TRIM(`department`)) = 'NSAWAM ULTRA CENTRE';

UPDATE `staff` SET `department` = 'ASHAIMAN'
WHERE UPPER(TRIM(`department`)) = 'ASHAIMAN ULTRA CENTRE';

UPDATE `staff` SET `department` = 'DOME'
WHERE UPPER(TRIM(`department`)) = 'DOME ULTRA CENTRE';

UPDATE `staff` SET `department` = 'DANSOMAN'
WHERE UPPER(TRIM(`department`)) = 'DANSOMAN ULTRA CENTRE';

UPDATE `staff` SET `department` = 'BONWIRE'
WHERE UPPER(TRIM(`department`)) = 'BONWIRE ULTRA CENTRE';

-- Normalize empty strings to NULL
UPDATE `staff` SET `department` = NULL WHERE TRIM(`department`) = '';
