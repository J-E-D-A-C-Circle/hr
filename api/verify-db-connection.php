<?php
/**
 * Quick Database Connection Verification
 * Access this file via: http://localhost/api/verify-db-connection.php
 */

require_once 'config.php';

// Set JSON header
header('Content-Type: application/json');

try {
    // Test database connection
    $conn = getDBConnection();
    
    $results = [
        'status' => 'SUCCESS',
        'database' => DB_NAME,
        'host' => DB_HOST,
        'connection' => 'CONNECTED',
        'timestamp' => date('Y-m-d H:i:s')
    ];
    
    // Test query
    $result = $conn->query("SELECT 1");
    if ($result) {
        $results['query_test'] = 'PASSED';
    }
    
    // Check tables
    $tables = ['users', 'nss_applications'];
    $results['tables'] = [];
    $db_name = DB_NAME; // Store constant in variable for bind_param
    foreach ($tables as $table) {
        // Use INFORMATION_SCHEMA instead of SHOW TABLES (more reliable with prepared statements)
        $stmt = $conn->prepare("SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?");
        if ($stmt) {
            $stmt->bind_param("ss", $db_name, $table);
            $stmt->execute();
            $tableResult = $stmt->get_result();
            $tableRow = $tableResult->fetch_assoc();
            $results['tables'][$table] = $tableRow['count'] > 0 ? 'EXISTS' : 'MISSING';
            $stmt->close();
        } else {
            // Fallback: use direct query with escaping
            $escaped_table = $conn->real_escape_string($table);
            $tableResult = $conn->query("SHOW TABLES LIKE '$escaped_table'");
            $results['tables'][$table] = $tableResult && $tableResult->num_rows > 0 ? 'EXISTS' : 'MISSING';
        }
    }
    
    // Count users
    $stmt = $conn->prepare("SELECT COUNT(*) as count FROM users");
    if ($stmt) {
        $stmt->execute();
        $userResult = $stmt->get_result();
        $userRow = $userResult->fetch_assoc();
        $results['total_users'] = $userRow ? $userRow['count'] : 0;
        $stmt->close();
    } else {
        $results['total_users'] = 0;
        $results['query_error'] = $conn->error;
    }
    
    // Check for admin user
    $stmt = $conn->prepare("SELECT id, email, role FROM users WHERE email = ?");
    if ($stmt) {
        $adminEmail = 'admin@dvla.gov.gh';
        $stmt->bind_param("s", $adminEmail);
        $stmt->execute();
        $adminResult = $stmt->get_result();
        $results['admin_user'] = $adminResult->num_rows > 0 ? 'EXISTS' : 'MISSING';
        $stmt->close();
    } else {
        $results['admin_user'] = 'ERROR';
        $results['admin_query_error'] = $conn->error;
    }
    
    echo json_encode($results, JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    echo json_encode([
        'status' => 'ERROR',
        'connection' => 'FAILED',
        'error' => $e->getMessage(),
        'database' => DB_NAME,
        'host' => DB_HOST,
        'timestamp' => date('Y-m-d H:i:s')
    ], JSON_PRETTY_PRINT);
}

?>

