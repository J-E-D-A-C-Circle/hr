<?php
// Main API router
$request_uri = $_SERVER['REQUEST_URI'];
$request_method = $_SERVER['REQUEST_METHOD'];

// Remove query string
$path = parse_url($request_uri, PHP_URL_PATH);

// Route to appropriate endpoint
if (strpos($path, '/api/auth') !== false) {
    require_once 'auth.php';
} elseif (strpos($path, '/api/applications') !== false) {
    require_once 'applications.php';
} else {
    http_response_code(404);
    echo json_encode(['error' => 'Endpoint not found']);
}

?>

