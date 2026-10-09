-- Departments-only script for the stations that already exist.
-- This does NOT insert or change station records.

INSERT INTO departments (station_id, name)
SELECT s.id, dept.department_name
FROM stations s
CROSS JOIN (
  SELECT 'Driver Licensing & Testing' AS department_name
  UNION ALL SELECT 'Vehicle Inspection & Registration'
  UNION ALL SELECT 'Customer Experience Desk'
  UNION ALL SELECT 'Regional Administration'
  UNION ALL SELECT 'Accounts & Revenue Desk'
  UNION ALL SELECT 'Front Desk & Inquiries'
  UNION ALL SELECT 'Administration & Human Resources'
  UNION ALL SELECT 'Finance & Accounting'
) dept
LEFT JOIN departments d
  ON d.station_id = s.id
 AND d.name = dept.department_name
WHERE d.id IS NULL;

-- View the result by station.
SELECT s.name AS station_name, d.name AS department_name
FROM stations s
JOIN departments d ON d.station_id = s.id
ORDER BY s.name, d.name;
