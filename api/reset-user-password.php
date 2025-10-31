<?php
// Script to reset a user's password
// Usage: api/reset-user-password.php?email=user@example.com&new_password=newpass123

require_once 'config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$conn = getDBConnection();

$email = $_GET['email'] ?? $_POST['email'] ?? '';
$newPassword = $_GET['new_password'] ?? $_POST['new_password'] ?? '';

if (empty($email)) {
    echo json_encode(['error' => 'Email is required']);
    exit;
}

if (empty($newPassword)) {
    echo json_encode(['error' => 'New password is required']);
    exit;
}

// Check if user exists
$stmt = $conn->prepare("SELECT id, email, full_name FROM users WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode(['error' => 'User not found']);
    exit;
}

$user = $result->fetch_assoc();

// Generate new password hash
$passwordHash = password_hash($newPassword, PASSWORD_BCRYPT);

// Update password
$stmt = $conn->prepare("UPDATE users SET password_hash = ? WHERE email = ?");
$stmt->bind_param("ss", $passwordHash, $email);

if ($stmt->execute()) {
    echo json_encode([
        'success' => true,
        'message' => 'Password reset successfully',
        'user' => [
            'id' => $user['id'],
            'email' => $user['email'],
            'full_name' => $user['full_name']
        ],
        'new_password' => $newPassword,
        'note' => 'Save this password securely. It will not be shown again.'
    ], JSON_PRETTY_PRINT);
} else {
    echo json_encode([
        'error' => 'Failed to reset password',
        'message' => $conn->error
    ]);
}

$conn->close();
?>

