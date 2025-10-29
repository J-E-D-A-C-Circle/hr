<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$conn = getDBConnection();

switch ($method) {
    case 'POST':
        if ($action === 'submit') {
            // Submit new application
            $payload = requireAuth(['nss_personnel']);
            $data = getJsonInput();
            
            // Validate required fields
            $required = ['first_name', 'last_name', 'date_of_birth', 'gender', 'nationality', 
                        'phone_number', 'email', 'residential_address', 'region', 'district',
                        'institution_name', 'course_program', 'year_of_completion', 'service_year'];
            
            foreach ($required as $field) {
                if (!isset($data[$field]) || empty($data[$field])) {
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
            $stmt = $conn->prepare("INSERT INTO nss_applications (
                user_id, nss_number, first_name, last_name, middle_name, date_of_birth, gender,
                nationality, phone_number, email, residential_address, region, district,
                institution_name, course_program, year_of_completion, posting_region,
                posting_district, service_year, service_period_start, service_period_end,
                passport_photo, id_card_copy, certificates, additional_info
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            
            $nssNumber = $data['nss_number'] ?? null;
            $middleName = $data['middle_name'] ?? null;
            $postingRegion = $data['posting_region'] ?? null;
            $postingDistrict = $data['posting_district'] ?? null;
            $serviceStart = $data['service_period_start'] ?? null;
            $serviceEnd = $data['service_period_end'] ?? null;
            $passportPhoto = $data['passport_photo'] ?? null;
            $idCard = $data['id_card_copy'] ?? null;
            $certificates = $data['certificates'] ?? null;
            $additionalInfo = $data['additional_info'] ?? null;
            
            $stmt->bind_param("isssssssssssssssssssssssss",
                $payload['user_id'], $nssNumber, $data['first_name'], $data['last_name'],
                $middleName, $data['date_of_birth'], $data['gender'], $data['nationality'],
                $data['phone_number'], $data['email'], $data['residential_address'],
                $data['region'], $data['district'], $data['institution_name'],
                $data['course_program'], $data['year_of_completion'], $postingRegion,
                $postingDistrict, $data['service_year'], $serviceStart, $serviceEnd,
                $passportPhoto, $idCard, $certificates, $additionalInfo
            );
            
            if ($stmt->execute()) {
                $applicationId = $conn->insert_id;
                sendJsonResponse([
                    'message' => 'Application submitted successfully',
                    'application_id' => $applicationId
                ], 201);
            } else {
                sendJsonResponse(['error' => 'Failed to submit application'], 500);
            }
        }
        break;
        
    case 'GET':
        if ($action === 'my-application') {
            // Get user's own application
            $payload = requireAuth(['nss_personnel']);
            
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
            
            $reviewNotes = $data['review_notes'] ?? null;
            
            $stmt = $conn->prepare("UPDATE nss_applications 
                                   SET status = ?, reviewed_by = ?, review_notes = ?, reviewed_at = NOW()
                                   WHERE id = ?");
            $stmt->bind_param("sisi", $data['status'], $payload['user_id'], $reviewNotes, $data['application_id']);
            
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

