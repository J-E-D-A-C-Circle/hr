<?php
// Script to check user and generate password reset
// This script will show the user's email and generate a new password hash
// PASSWORDS ARE HASHED - CANNOT BE RETRIEVED, ONLY RESET

require_once 'config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$conn = getDBConnection();

// Search for user by email or full name
$searchTerm = $_GET['search'] ?? 'elvira';

// Try to find user by email (case-insensitive)
$stmt = $conn->prepare("SELECT id, email, full_name, role, password_hash, created_at FROM users WHERE LOWER(email) LIKE LOWER(?) OR LOWER(full_name) LIKE LOWER(?)");
$searchPattern = '%' . $searchTerm . '%';
$stmt->bind_param("ss", $searchPattern, $searchPattern);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode([
        'error' => 'User not found',
        'search_term' => $searchTerm
    ]);
    exit;
}

$users = [];
while ($row = $result->fetch_assoc()) {
    $users[] = [
        'id' => $row['id'],
        'email' => $row['email'],
        'full_name' => $row['full_name'],
        'role' => $row['role'],
        'password_hash_length' => strlen($row['password_hash']),
        'password_hash_format' => substr($row['password_hash'], 0, 7) === '$2y$10' ? 'BCRYPT' : 'UNKNOWN',
        'created_at' => $row['created_at'],
        'note' => 'Password is hashed and cannot be retrieved. Use password reset to create a new password.'
    ];
}

echo json_encode([
    'message' => 'User(s) found',
    'users' => $users,
    'instructions' => [
        '1. Passwords are hashed using bcrypt and CANNOT be retrieved',
        '2. To reset password, you can:',
        '   - Use the reset script (api/reset-user-password.php)',
        '   - Or manually update in database using: password_hash("newpassword", PASSWORD_BCRYPT)'
    ]
], JSON_PRETTY_PRINT);

$conn->close();
?>

