<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

switch ($method) {
    case 'POST':
        if ($action === 'register') {
            // Register new user
            $data = getJsonInput();
            
            if (!isset($data['email']) || !isset($data['password']) || !isset($data['full_name'])) {
                sendJsonResponse(['error' => 'Missing required fields'], 400);
            }
            
            if (!isValidEmail($data['email'])) {
                sendJsonResponse(['error' => 'Invalid email address'], 400);
            }
            
            $conn = getDBConnection();
            
            // Check if email already exists
            $stmt = $conn->prepare("SELECT id FROM users WHERE email = ?");
            $stmt->bind_param("s", $data['email']);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($result->num_rows > 0) {
                sendJsonResponse(['error' => 'Email already registered'], 409);
            }
            
            // Create new user
            $passwordHash = hashPassword($data['password']);
            $stmt = $conn->prepare("INSERT INTO users (email, password_hash, full_name, role) VALUES (?, ?, ?, 'applicant')");
            $stmt->bind_param("sss", $data['email'], $passwordHash, $data['full_name']);
            
            if ($stmt->execute()) {
                $userId = $conn->insert_id;
                $token = generateToken($userId, $data['email'], 'applicant');
                sendJsonResponse([
                    'message' => 'Registration successful',
                    'token' => $token,
                    'user' => [
                        'id' => $userId,
                        'email' => $data['email'],
                        'full_name' => $data['full_name'],
                        'role' => 'applicant'
                    ]
                ]);
            } else {
                sendJsonResponse(['error' => 'Registration failed'], 500);
            }
        }
        elseif ($action === 'login') {
            // Login user
            $data = getJsonInput();
            
            if (!isset($data['email']) || !isset($data['password'])) {
                sendJsonResponse(['error' => 'Email and password required'], 400);
            }
            
            $conn = getDBConnection();
            $stmt = $conn->prepare("SELECT id, email, password_hash, role, full_name FROM users WHERE email = ?");
            $stmt->bind_param("s", $data['email']);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($result->num_rows === 0) {
                sendJsonResponse(['error' => 'Invalid credentials'], 401);
            }
            
            $user = $result->fetch_assoc();
            
            if (!verifyPassword($data['password'], $user['password_hash'])) {
                sendJsonResponse(['error' => 'Invalid credentials'], 401);
            }
            
            $token = generateToken($user['id'], $user['email'], $user['role']);
            sendJsonResponse([
                'message' => 'Login successful',
                'token' => $token,
                'user' => [
                    'id' => $user['id'],
                    'email' => $user['email'],
                    'full_name' => $user['full_name'],
                    'role' => $user['role']
                ]
            ]);
        }
        else {
            sendJsonResponse(['error' => 'Invalid action'], 400);
        }
        break;
        
    case 'GET':
        if ($action === 'me') {
            // Get current user info
            $payload = requireAuth();
            $conn = getDBConnection();
            $stmt = $conn->prepare("SELECT id, email, full_name, role FROM users WHERE id = ?");
            $stmt->bind_param("i", $payload['user_id']);
            $stmt->execute();
            $result = $stmt->get_result();
            $user = $result->fetch_assoc();
            
            sendJsonResponse(['user' => $user]);
        }
        else {
            sendJsonResponse(['error' => 'Invalid action'], 400);
        }
        break;
        
    default:
        sendJsonResponse(['error' => 'Method not allowed'], 405);
}

?>

