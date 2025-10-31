<?php
// Suppress warnings that could output HTML
error_reporting(E_ALL & ~E_WARNING & ~E_NOTICE);
ini_set('display_errors', 0);
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'upload';

// Set headers for CORS (needed for file uploads)
$allowed_origins = ['http://localhost:3000', 'http://127.0.0.1:3000'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if (in_array($origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header('Access-Control-Allow-Origin: http://localhost:3000');
}

header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Override Content-Type header for JSON responses (not for file serving)
if ($method === 'POST' && $action === 'upload') {
    header('Content-Type: application/json');
}

// File upload configuration
define('UPLOAD_DIR', __DIR__ . '/../uploads/');
define('MAX_FILE_SIZE', 5 * 1024 * 1024); // 5MB

// Allowed file types
$allowedTypes = [
    'passport' => ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    'appointment' => ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'],
    'cv' => ['application/pdf'],
    'id_card' => ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'],
];

// Create upload directories if they don't exist
function ensureUploadDirs() {
    $dirs = ['passport', 'appointment', 'cv', 'id_card'];
    foreach ($dirs as $dir) {
        $path = UPLOAD_DIR . $dir . '/';
        if (!is_dir($path)) {
            mkdir($path, 0755, true);
        }
    }
}

// Sanitize filename
function sanitizeFilename($filename) {
    $filename = preg_replace('/[^a-zA-Z0-9._-]/', '_', $filename);
    return time() . '_' . $filename;
}

// Validate file type
function validateFileType($file, $fileCategory) {
    global $allowedTypes;
    
    if (!isset($allowedTypes[$fileCategory])) {
        return ['valid' => false, 'error' => 'Invalid file category'];
    }
    
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mimeType = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);
    
    if (!in_array($mimeType, $allowedTypes[$fileCategory])) {
        return ['valid' => false, 'error' => 'Invalid file type. Allowed: ' . implode(', ', $allowedTypes[$fileCategory])];
    }
    
    return ['valid' => true, 'mime_type' => $mimeType];
}

switch ($method) {
    case 'POST':
        if ($action === 'upload') {
            $payload = requireAuth(['applicant']);
            
            if (!isset($_FILES['file']) || !isset($_POST['file_type'])) {
                sendJsonResponse(['error' => 'File and file_type are required'], 400);
            }
            
            $file = $_FILES['file'];
            $fileType = $_POST['file_type']; // 'passport', 'appointment', 'cv', 'id_card'
            
            // Validate file type category
            if (!in_array($fileType, ['passport', 'appointment', 'cv', 'id_card'])) {
                sendJsonResponse(['error' => 'Invalid file_type. Must be: passport, appointment, cv, or id_card'], 400);
            }
            
            // Check for upload errors
            if ($file['error'] !== UPLOAD_ERR_OK) {
                sendJsonResponse(['error' => 'File upload failed'], 400);
            }
            
            // Check file size
            if ($file['size'] > MAX_FILE_SIZE) {
                sendJsonResponse(['error' => 'File size exceeds 5MB limit'], 400);
            }
            
            // Validate file type
            $validation = validateFileType($file, $fileType);
            if (!$validation['valid']) {
                sendJsonResponse(['error' => $validation['error']], 400);
            }
            
            // Ensure upload directories exist
            ensureUploadDirs();
            
            // Get user's name from database for folder naming
            $conn = getDBConnection();
            $userStmt = $conn->prepare("SELECT full_name FROM users WHERE id = ?");
            $userStmt->bind_param("i", $payload['user_id']);
            $userStmt->execute();
            $userResult = $userStmt->get_result();
            $user = $userResult->fetch_assoc();
            $userName = $user && isset($user['full_name']) ? $user['full_name'] : 'user';
            
            // Sanitize user name for filesystem (remove spaces, special chars, convert to lowercase)
            $sanitizedUserName = strtolower(preg_replace('/[^a-zA-Z0-9-]/', '-', $userName));
            $sanitizedUserName = preg_replace('/-+/', '-', $sanitizedUserName); // Remove multiple dashes
            $sanitizedUserName = trim($sanitizedUserName, '-'); // Remove leading/trailing dashes
            
            // If name is empty after sanitization, use 'user' as fallback
            if (empty($sanitizedUserName)) {
                $sanitizedUserName = 'user';
            }
            
            // Generate unique filename
            $originalName = $file['name'];
            $extension = pathinfo($originalName, PATHINFO_EXTENSION);
            $sanitizedFilename = sanitizeFilename($originalName);
            
            // Create user-specific subdirectory with name: e.g., "3-constance"
            $userFolderName = $payload['user_id'] . '-' . $sanitizedUserName;
            $userDir = UPLOAD_DIR . $fileType . '/' . $userFolderName . '/';
            if (!is_dir($userDir)) {
                mkdir($userDir, 0755, true);
            }
            
            // Full path for the file
            $targetPath = $userDir . $sanitizedFilename;
            
            // Move uploaded file
            if (move_uploaded_file($file['tmp_name'], $targetPath)) {
                // Return relative path from uploads directory
                $relativePath = $fileType . '/' . $userFolderName . '/' . $sanitizedFilename;
                
                sendJsonResponse([
                    'success' => true,
                    'file_path' => $relativePath,
                    'file_name' => $originalName,
                    'file_size' => $file['size'],
                    'mime_type' => $validation['mime_type']
                ], 201);
            } else {
                sendJsonResponse(['error' => 'Failed to save file'], 500);
            }
        }
        break;
        
    case 'GET':
        if ($action === 'serve') {
            // Clear any previous output
            if (ob_get_level()) {
                ob_end_clean();
            }
            
            // Serve file (for admin viewing)
            // Accept token from query param or Authorization header
            $token = $_GET['token'] ?? getAuthToken();
            if ($token) {
                $payload = verifyToken($token);
                if (!$payload || (!in_array($payload['role'], ['admin', 'applicant']))) {
                    http_response_code(401);
                    header('Content-Type: text/plain');
                    echo 'Unauthorized';
                    exit;
                }
            } else {
                // Fallback to requireAuth for backward compatibility
                $payload = requireAuth(['admin', 'applicant']);
            }
            
            $filePath = $_GET['path'] ?? '';
            
            if (empty($filePath)) {
                http_response_code(400);
                header('Content-Type: text/plain');
                echo 'File path required';
                exit;
            }
            
            // Sanitize path to prevent directory traversal
            $filePath = str_replace('..', '', $filePath);
            $fullPath = UPLOAD_DIR . $filePath;
            
            // Normalize path separators for Windows
            $fullPath = str_replace('/', DIRECTORY_SEPARATOR, $fullPath);
            $fullPath = str_replace('\\', DIRECTORY_SEPARATOR, $fullPath);
            
            // Check if file exists - support both old format (user_id only) and new format (user_id-name)
            if (!file_exists($fullPath) || !is_file($fullPath)) {
                // Extract path parts
                $pathParts = explode('/', $filePath);
                if (count($pathParts) >= 3) {
                    $fileType = $pathParts[0];
                    $userFolder = $pathParts[1];
                    $fileName = $pathParts[2];
                    
                    // If folder is just a number (old format in DB), try to find it in new format location
                    if (preg_match('/^\d+$/', $userFolder)) {
                        // Get user's name to construct new format path
                        $conn = getDBConnection();
                        $userStmt = $conn->prepare("SELECT full_name FROM users WHERE id = ?");
                        $userStmt->bind_param("i", $userFolder);
                        $userStmt->execute();
                        $userResult = $userStmt->get_result();
                        if ($userResult->num_rows > 0) {
                            $user = $userResult->fetch_assoc();
                            $userName = $user && isset($user['full_name']) ? $user['full_name'] : 'user';
                            $sanitizedUserName = strtolower(preg_replace('/[^a-zA-Z0-9-]/', '-', $userName));
                            $sanitizedUserName = preg_replace('/-+/', '-', $sanitizedUserName);
                            $sanitizedUserName = trim($sanitizedUserName, '-');
                            if (empty($sanitizedUserName)) {
                                $sanitizedUserName = 'user';
                            }
                            
                            // Try new format path (user_id-name)
                            $newPath = $fileType . '/' . $userFolder . '-' . $sanitizedUserName . '/' . $fileName;
                            $newFullPath = UPLOAD_DIR . $newPath;
                            $newFullPath = str_replace('/', DIRECTORY_SEPARATOR, $newFullPath);
                            $newFullPath = str_replace('\\', DIRECTORY_SEPARATOR, $newFullPath);
                            
                            if (file_exists($newFullPath) && is_file($newFullPath)) {
                                $fullPath = $newFullPath;
                            }
                        }
                    }
                }
                
                // Final check
                if (!file_exists($fullPath) || !is_file($fullPath)) {
                    http_response_code(404);
                    header('Content-Type: text/plain');
                    echo 'File not found: ' . $filePath;
                    exit;
                }
            }
            
            // Security check: only allow access to files in upload directories
            $realPath = realpath($fullPath);
            $realUploadDir = realpath(UPLOAD_DIR);
            
            if (!$realPath || !$realUploadDir || strpos($realPath, $realUploadDir) !== 0) {
                http_response_code(403);
                header('Content-Type: text/plain');
                echo 'Access denied';
                exit;
            }
            
            // Determine MIME type
            $mimeType = 'application/octet-stream'; // Default fallback
            if (function_exists('finfo_open')) {
                $finfo = finfo_open(FILEINFO_MIME_TYPE);
                if ($finfo) {
                    $detectedMime = finfo_file($finfo, $fullPath);
                    if ($detectedMime) {
                        $mimeType = $detectedMime;
                    }
                    finfo_close($finfo);
                }
            }
            
            // Fallback to extension-based MIME type if finfo failed
            if ($mimeType === 'application/octet-stream') {
                $ext = strtolower(pathinfo($fullPath, PATHINFO_EXTENSION));
                $mimeTypes = [
                    'jpg' => 'image/jpeg',
                    'jpeg' => 'image/jpeg',
                    'png' => 'image/png',
                    'gif' => 'image/gif',
                    'webp' => 'image/webp',
                    'pdf' => 'application/pdf',
                ];
                if (isset($mimeTypes[$ext])) {
                    $mimeType = $mimeTypes[$ext];
                }
            }
            
            // Set headers - MUST come before any output
            header('Content-Type: ' . $mimeType);
            header('Content-Disposition: inline; filename="' . basename($fullPath) . '"');
            header('Content-Length: ' . filesize($fullPath));
            header('Cache-Control: private, max-age=3600');
            header('Pragma: public');
            
            // Disable output buffering and output the file
            if (ob_get_level()) {
                ob_end_clean();
            }
            
            readfile($fullPath);
            exit;
        }
        break;
        
    default:
        sendJsonResponse(['error' => 'Method not allowed'], 405);
}

?>

