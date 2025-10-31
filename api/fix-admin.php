<?php
// Allow CORS for testing
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

require_once 'config.php';

// Check if admin user exists and create/update it
$conn = getDBConnection();

// Check if admin exists
$stmt = $conn->prepare("SELECT id, password_hash FROM users WHERE email = ? AND role = 'admin'");
$adminEmail = 'admin@dvla.gov.gh';
$stmt->bind_param("s", $adminEmail);
$stmt->execute();
$result = $stmt->get_result();

// Password: admin123 - Generate fresh hash
$passwordHash = password_hash('admin123', PASSWORD_BCRYPT);

// Test verification
$verifyTest = password_verify('admin123', $passwordHash);

if ($result->num_rows === 0) {
    // Admin doesn't exist, create it
    $stmt = $conn->prepare("INSERT INTO users (email, password_hash, role, full_name) VALUES (?, ?, 'admin', 'System Administrator')");
    $stmt->bind_param("ss", $adminEmail, $passwordHash);
    
    if ($stmt->execute()) {
        echo json_encode([
            'success' => true,
            'message' => 'Admin user created successfully',
            'email' => $adminEmail,
            'password' => 'admin123',
            'password_hash' => $passwordHash
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'error' => 'Failed to create admin user: ' . $conn->error
        ]);
    }
} else {
    // Admin exists, update password hash
    $admin = $result->fetch_assoc();
    $stmt = $conn->prepare("UPDATE users SET password_hash = ? WHERE email = ? AND role = 'admin'");
    $stmt->bind_param("ss", $passwordHash, $adminEmail);
    
    if ($stmt->execute()) {
        echo json_encode([
            'success' => true,
            'message' => 'Admin password hash updated successfully',
            'email' => $adminEmail,
            'password' => 'admin123',
            'user_id' => $admin['id'],
            'old_hash' => $admin['password_hash'],
            'new_hash' => $passwordHash,
            'verify_test' => password_verify('admin123', $passwordHash) ? 'PASSED' : 'FAILED'
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'error' => 'Failed to update admin password: ' . $conn->error
        ]);
    }
}

$conn->close();
?>

