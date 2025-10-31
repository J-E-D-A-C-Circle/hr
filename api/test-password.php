<?php
// Test password reset and verification
// Usage: api/test-password.php?email=user@example.com&password=testpass

require_once 'config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$conn = getDBConnection();

$email = $_GET['email'] ?? '';
$testPassword = $_GET['password'] ?? '';

if (empty($email)) {
    echo json_encode(['error' => 'Email is required']);
    exit;
}

// Get user
$stmt = $conn->prepare("SELECT id, email, full_name, password_hash, role FROM users WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode(['error' => 'User not found']);
    exit;
}

$user = $result->fetch_assoc();

$response = [
    'user_found' => true,
    'user' => [
        'id' => $user['id'],
        'email' => $user['email'],
        'full_name' => $user['full_name'],
        'role' => $user['role']
    ],
    'password_hash_info' => [
        'length' => strlen($user['password_hash']),
        'format' => substr($user['password_hash'], 0, 7) === '$2y$10' ? 'BCRYPT ($2y$10)' : 'UNKNOWN',
        'first_30_chars' => substr($user['password_hash'], 0, 30) . '...'
    ]
];

// Test password verification if password provided
if (!empty($testPassword)) {
    $verifyResult = password_verify($testPassword, $user['password_hash']);
    $response['password_test'] = [
        'tested_password' => $testPassword,
        'verification_result' => $verifyResult ? 'MATCH' : 'NO MATCH',
        'note' => $verifyResult 
            ? 'Password is correct! You should be able to login.'
            : 'Password does not match. Either wrong password or hash issue.'
    ];
    
    // Also test with a new hash generation
    $newHash = password_hash($testPassword, PASSWORD_BCRYPT);
    $verifyWithNewHash = password_verify($testPassword, $newHash);
    $response['new_hash_test'] = [
        'new_hash_generated' => true,
        'new_hash_verification' => $verifyWithNewHash ? 'WORKS' : 'FAILED',
        'note' => 'This tests if bcrypt is working correctly'
    ];
} else {
    $response['note'] = 'Provide a password parameter to test: ?email=xxx&password=yyy';
}

echo json_encode($response, JSON_PRETTY_PRINT);

$conn->close();
?>

