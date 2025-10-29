<?php
// Database configuration
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'dvla_nss_portal');

// Create database connection
function getDBConnection() {
    try {
        $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
        
        if ($conn->connect_error) {
            throw new Exception("Connection failed: " . $conn->connect_error);
        }
        
        $conn->set_charset("utf8mb4");
        return $conn;
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database connection failed', 'message' => $e->getMessage()]);
        exit;
    }
}

// CORS headers
$allowed_origins = ['http://localhost:3000', 'http://127.0.0.1:3000'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if (in_array($origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header('Access-Control-Allow-Origin: http://localhost:3000');
}

header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Helper function to get JSON input
function getJsonInput() {
    $json = file_get_contents('php://input');
    return json_decode($json, true);
}

// Helper function to send JSON response
function sendJsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data);
    exit;
}

// Helper function to validate email
function isValidEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL);
}

// Helper function to hash password
function hashPassword($password) {
    return password_hash($password, PASSWORD_BCRYPT);
}

// Helper function to verify password
function verifyPassword($password, $hash) {
    return password_verify($password, $hash);
}

// Helper function to generate JWT-like token (simple version)
function generateToken($userId, $email, $role) {
    $payload = [
        'user_id' => $userId,
        'email' => $email,
        'role' => $role,
        'exp' => time() + (24 * 60 * 60) // 24 hours
    ];
    return base64_encode(json_encode($payload));
}

// Helper function to verify token
function verifyToken($token) {
    try {
        $payload = json_decode(base64_decode($token), true);
        if ($payload && isset($payload['exp']) && $payload['exp'] > time()) {
            return $payload;
        }
        return null;
    } catch (Exception $e) {
        return null;
    }
}

// Helper function to get auth token from request
function getAuthToken() {
    $headers = getallheaders();
    if (isset($headers['Authorization'])) {
        return str_replace('Bearer ', '', $headers['Authorization']);
    }
    return null;
}

// Helper function to require authentication
function requireAuth($allowedRoles = []) {
    $token = getAuthToken();
    if (!$token) {
        sendJsonResponse(['error' => 'Unauthorized', 'message' => 'No token provided'], 401);
    }
    
    $payload = verifyToken($token);
    if (!$payload) {
        sendJsonResponse(['error' => 'Unauthorized', 'message' => 'Invalid or expired token'], 401);
    }
    
    if (!empty($allowedRoles) && !in_array($payload['role'], $allowedRoles)) {
        sendJsonResponse(['error' => 'Forbidden', 'message' => 'Insufficient permissions'], 403);
    }
    
    return $payload;
}

?>

