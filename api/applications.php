<?php
// Suppress warnings that could output HTML
error_reporting(E_ALL & ~E_WARNING & ~E_NOTICE);
ini_set('display_errors', 0);
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$conn = getDBConnection();

switch ($method) {
    case 'POST':
        if ($action === 'submit') {
            // Submit new application
            $payload = requireAuth(['applicant']);
            $data = getJsonInput();
            
            // Log received data for debugging
            error_log('Received application data: ' . json_encode($data));
            
            // Ensure string fields are strings (prevent "0" from being treated as empty)
            $data['course_program'] = isset($data['course_program']) ? (string)$data['course_program'] : '';
            $data['posting_district'] = isset($data['posting_district']) ? (string)$data['posting_district'] : null;
            
            // Validate required fields
            $required = ['first_name', 'last_name', 'date_of_birth', 'gender', 'nationality', 
                        'phone_number', 'email', 'residential_address', 'region', 'district',
                        'institution_name', 'course_program', 'year_of_completion', 'service_year'];
            
            foreach ($required as $field) {
                // Special handling for course_program - "0" is not valid
                if ($field === 'course_program' && (empty($data[$field]) || $data[$field] === '0')) {
                    sendJsonResponse(['error' => "Field 'course_program' is required and cannot be empty"], 400);
                }
                if (!isset($data[$field]) || ($data[$field] !== '0' && empty($data[$field]))) {
                    sendJsonResponse(['error' => "Field '$field' is required"], 400);
                }
            }
            
            // Check if user already has an application
            $stmt = $conn->prepare("SELECT id FROM nss_applications WHERE user_id = ?");
            $stmt->bind_param("i", $payload['user_id']);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($result->num_rows > 0) {
                sendJsonResponse(['error' => 'You already have a submitted application'], 409);
            }
            
            // Insert application
            // Check if appointment_letter column exists, if not use NULL
            $hasAppointmentLetter = false;
            $result = $conn->query("SHOW COLUMNS FROM nss_applications LIKE 'appointment_letter'");
            if ($result && $result->num_rows > 0) {
                $hasAppointmentLetter = true;
            }
            
            if ($hasAppointmentLetter) {
                $stmt = $conn->prepare("INSERT INTO nss_applications (
                    user_id, nss_number, first_name, last_name, middle_name, date_of_birth, gender,
                    nationality, phone_number, email, residential_address, region, district,
                    institution_name, course_program, year_of_completion, posting_region,
                    posting_district, service_year, service_period_start, service_period_end,
                    passport_photo, id_card_copy, appointment_letter, certificates, additional_info
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            } else {
                $stmt = $conn->prepare("INSERT INTO nss_applications (
                    user_id, nss_number, first_name, last_name, middle_name, date_of_birth, gender,
                    nationality, phone_number, email, residential_address, region, district,
                    institution_name, course_program, year_of_completion, posting_region,
                    posting_district, service_year, service_period_start, service_period_end,
                    passport_photo, id_card_copy, certificates, additional_info
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            }
            
            $nssNumber = $data['nss_number'] ?? null;
            $middleName = $data['middle_name'] ?? null;
            $postingRegion = isset($data['posting_region']) ? (string)$data['posting_region'] : null;
            $postingDistrict = isset($data['posting_district']) ? (string)$data['posting_district'] : null;
            
            // Ensure course_program is properly set
            $courseProgram = isset($data['course_program']) ? (string)$data['course_program'] : '';
            error_log('Course program value: ' . $courseProgram);
            error_log('Posting district value: ' . ($postingDistrict ?? 'NULL'));
            $serviceStart = $data['service_period_start'] ?? null;
            $serviceEnd = $data['service_period_end'] ?? null;
            $passportPhoto = $data['passport_photo'] ?? null;
            $idCard = $data['id_card_copy'] ?? null;
            $appointmentLetter = $data['appointment_letter'] ?? null;
            $certificates = $data['certificates'] ?? null; // Used for CV
            $additionalInfo = $data['additional_info'] ?? null;
            
            if (!$stmt) {
                $errorMsg = $conn->error;
                error_log('SQL prepare error: ' . $errorMsg);
                sendJsonResponse(['error' => 'Database error: ' . $errorMsg], 500);
            }
            
            // Convert year fields to integers for YEAR type columns
            $yearOfCompletion = !empty($data['year_of_completion']) ? intval($data['year_of_completion']) : null;
            $serviceYear = !empty($data['service_year']) ? intval($data['service_year']) : null;
            
            if ($hasAppointmentLetter) {
                // Count: 26 parameters (i + 25s)
                $bindResult = $stmt->bind_param("isssssssssssssissississsss",
                    $payload['user_id'], // i
                    $nssNumber, // s
                    $data['first_name'], // s
                    $data['last_name'], // s
                    $middleName, // s
                    $data['date_of_birth'], // s
                    $data['gender'], // s
                    $data['nationality'], // s
                    $data['phone_number'], // s
                    $data['email'], // s
                    $data['residential_address'], // s
                    $data['region'], // s
                    $data['district'], // s
                    $data['institution_name'], // s
                    $courseProgram, // s
                    $yearOfCompletion, // i (YEAR type)
                    $postingRegion, // s
                    $postingDistrict, // s
                    $serviceYear, // i (YEAR type)
                    $serviceStart, // s
                    $serviceEnd, // s
                    $passportPhoto, // s
                    $idCard, // s
                    $appointmentLetter, // s
                    $certificates, // s
                    $additionalInfo // s
                );
                if (!$bindResult) {
                    error_log('Bind param error: ' . $stmt->error);
                    error_log('SQL: ' . $stmt->sqlstate);
                    sendJsonResponse(['error' => 'Database binding error: ' . $stmt->error . ' (SQL State: ' . $stmt->sqlstate . ')'], 500);
                }
            } else {
                // Count: 24 parameters (i + 23s)
                $bindResult = $stmt->bind_param("isssssssssssssissississss",
                    $payload['user_id'], // i
                    $nssNumber, // s
                    $data['first_name'], // s
                    $data['last_name'], // s
                    $middleName, // s
                    $data['date_of_birth'], // s
                    $data['gender'], // s
                    $data['nationality'], // s
                    $data['phone_number'], // s
                    $data['email'], // s
                    $data['residential_address'], // s
                    $data['region'], // s
                    $data['district'], // s
                    $data['institution_name'], // s
                    $courseProgram, // s
                    $yearOfCompletion, // i (YEAR type)
                    $postingRegion, // s
                    $postingDistrict, // s
                    $serviceYear, // i (YEAR type)
                    $serviceStart, // s
                    $serviceEnd, // s
                    $passportPhoto, // s
                    $idCard, // s
                    $certificates, // s
                    $additionalInfo // s
                );
                if (!$bindResult) {
                    error_log('Bind param error: ' . $stmt->error);
                    error_log('SQL: ' . $stmt->sqlstate);
                    sendJsonResponse(['error' => 'Database binding error: ' . $stmt->error . ' (SQL State: ' . $stmt->sqlstate . ')'], 500);
                }
            }
            
            if ($stmt->execute()) {
                $applicationId = $conn->insert_id;
                sendJsonResponse([
                    'message' => 'Application submitted successfully',
                    'application_id' => $applicationId
                ], 201);
            } else {
                $errorMsg = $stmt->error ? $stmt->error : $conn->error;
                error_log('Application submission SQL error: ' . $errorMsg);
                sendJsonResponse(['error' => 'Failed to submit application: ' . $errorMsg], 500);
            }
        }
        break;
        
    case 'GET':
        if ($action === 'my-application') {
            // Get user's own application
            $payload = requireAuth(['applicant']);
            
            $stmt = $conn->prepare("SELECT * FROM nss_applications WHERE user_id = ?");
            $stmt->bind_param("i", $payload['user_id']);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($result->num_rows > 0) {
                $application = $result->fetch_assoc();
                sendJsonResponse(['application' => $application]);
            } else {
                sendJsonResponse(['application' => null]);
            }
        }
        elseif ($action === 'all' || empty($action)) {
            // Get all applications (admin only)
            $payload = requireAuth(['admin']);
            $status = $_GET['status'] ?? null;
            
            if ($status) {
                $stmt = $conn->prepare("SELECT a.*, u.full_name as user_name, u.email as user_email 
                                       FROM nss_applications a 
                                       JOIN users u ON a.user_id = u.id 
                                       WHERE a.status = ? 
                                       ORDER BY a.created_at DESC");
                $stmt->bind_param("s", $status);
            } else {
                $stmt = $conn->prepare("SELECT a.*, u.full_name as user_name, u.email as user_email 
                                       FROM nss_applications a 
                                       JOIN users u ON a.user_id = u.id 
                                       ORDER BY a.created_at DESC");
            }
            
            $stmt->execute();
            $result = $stmt->get_result();
            $applications = [];
            
            while ($row = $result->fetch_assoc()) {
                $applications[] = $row;
            }
            
            sendJsonResponse(['applications' => $applications]);
        }
        elseif ($action === 'view') {
            // View specific application
            $payload = requireAuth(['admin']);
            $applicationId = $_GET['id'] ?? null;
            
            if (!$applicationId) {
                sendJsonResponse(['error' => 'Application ID required'], 400);
            }
            
            $stmt = $conn->prepare("SELECT a.*, u.full_name as user_name, u.email as user_email,
                                           r.full_name as reviewer_name
                                    FROM nss_applications a 
                                    JOIN users u ON a.user_id = u.id 
                                    LEFT JOIN users r ON a.reviewed_by = r.id
                                    WHERE a.id = ?");
            $stmt->bind_param("i", $applicationId);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($result->num_rows > 0) {
                sendJsonResponse(['application' => $result->fetch_assoc()]);
            } else {
                sendJsonResponse(['error' => 'Application not found'], 404);
            }
        }
        elseif ($action === 'generate-pdf') {
            // Generate PDF for approved application
            $payload = requireAuth(['applicant', 'admin']);
            $applicationId = $_GET['id'] ?? null;
            
            if (!$applicationId) {
                // If no ID provided and user is applicant, get their own application
                if ($payload['role'] === 'applicant') {
                    $stmt = $conn->prepare("SELECT id FROM nss_applications WHERE user_id = ? AND status = 'approved'");
                    $stmt->bind_param("i", $payload['user_id']);
                    $stmt->execute();
                    $result = $stmt->get_result();
                    if ($result->num_rows > 0) {
                        $row = $result->fetch_assoc();
                        $applicationId = $row['id'];
                    } else {
                        sendJsonResponse(['error' => 'No approved application found'], 404);
                    }
                } else {
                    sendJsonResponse(['error' => 'Application ID required'], 400);
                }
            }
            
            // Verify access - applicants can only view their own
            $stmt = $conn->prepare("SELECT a.*, u.full_name as user_name 
                                   FROM nss_applications a 
                                   JOIN users u ON a.user_id = u.id 
                                   WHERE a.id = ?");
            $stmt->bind_param("i", $applicationId);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($result->num_rows === 0) {
                sendJsonResponse(['error' => 'Application not found'], 404);
            }
            
            $application = $result->fetch_assoc();
            
            // Check access permission
            if ($payload['role'] === 'applicant' && $application['user_id'] != $payload['user_id']) {
                sendJsonResponse(['error' => 'Unauthorized'], 403);
            }
            
            if ($application['status'] !== 'approved') {
                sendJsonResponse(['error' => 'Application must be approved to generate PDF'], 400);
            }
            
            // Return application data for PDF generation (client-side)
            sendJsonResponse([
                'application' => $application,
                'pdf_data' => $application
            ]);
        }
        break;
        
    case 'PUT':
        if ($action === 'review') {
            // Review application (approve/reject)
            $payload = requireAuth(['admin']);
            $data = getJsonInput();
            
            if (!isset($data['application_id']) || !isset($data['status'])) {
                sendJsonResponse(['error' => 'Application ID and status required'], 400);
            }
            
            $allowedStatuses = ['approved', 'rejected', 'under_review'];
            if (!in_array($data['status'], $allowedStatuses)) {
                sendJsonResponse(['error' => 'Invalid status'], 400);
            }
            
            // If approved, require station and department
            if ($data['status'] === 'approved') {
                if (empty($data['posting_station']) || empty($data['posting_department'])) {
                    sendJsonResponse(['error' => 'Station and Department are required for approval'], 400);
                }
            }
            
            $reviewNotes = $data['review_notes'] ?? null;
            $postingStation = $data['posting_station'] ?? null;
            $postingDepartment = $data['posting_department'] ?? null;
            
            $stmt = $conn->prepare("UPDATE nss_applications 
                                   SET status = ?, reviewed_by = ?, review_notes = ?, 
                                       posting_station = ?, posting_department = ?, reviewed_at = NOW()
                                   WHERE id = ?");
            $stmt->bind_param("sisssi", $data['status'], $payload['user_id'], $reviewNotes, 
                            $postingStation, $postingDepartment, $data['application_id']);
            
            if ($stmt->execute()) {
                sendJsonResponse(['message' => 'Application reviewed successfully']);
            } else {
                sendJsonResponse(['error' => 'Failed to update application'], 500);
            }
        }
        break;
        
    default:
        sendJsonResponse(['error' => 'Method not allowed'], 405);
}

?>

