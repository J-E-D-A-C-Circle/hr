<?php
/**
 * Database Connection Test Script
 * Run this to verify your MySQL connection and schema are set up correctly
 * Access via: http://localhost/api/test-connection.php
 */

require_once 'config.php';

header('Content-Type: application/json');

try {
    $conn = getDBConnection();
    
    $results = [
        'database_connection' => 'SUCCESS',
        'database_name' => DB_NAME,
        'checks' => []
    ];
    
    // Check if tables exist
    $tables = ['users', 'nss_applications'];
    foreach ($tables as $table) {
        $stmt = $conn->prepare("SHOW TABLES LIKE ?");
        $stmt->bind_param("s", $table);
        $stmt->execute();
        $result = $stmt->get_result();
        $exists = $result->num_rows > 0;
        
        $results['checks'][] = [
            'table' => $table,
            'exists' => $exists
        ];
    }
    
    // Check if nss_applications table has required columns
    if ($results['checks'][1]['exists']) {
        $stmt = $conn->prepare("SHOW COLUMNS FROM nss_applications LIKE 'posting_station'");
        $stmt->execute();
        $result = $stmt->get_result();
        $hasStation = $result->num_rows > 0;
        
        $stmt = $conn->prepare("SHOW COLUMNS FROM nss_applications LIKE 'posting_department'");
        $stmt->execute();
        $result = $stmt->get_result();
        $hasDepartment = $result->num_rows > 0;
        
        $results['checks'][] = [
            'column' => 'posting_station',
            'exists' => $hasStation,
            'required' => true
        ];
        
        $results['checks'][] = [
            'column' => 'posting_department',
            'exists' => $hasDepartment,
            'required' => true
        ];
        
        // Get table structure
        $stmt = $conn->prepare("DESCRIBE nss_applications");
        $stmt->execute();
        $result = $stmt->get_result();
        $columns = [];
        while ($row = $result->fetch_assoc()) {
            $columns[] = $row['Field'];
        }
        $results['table_structure'] = $columns;
    }
    
    // Test a simple query
    $stmt = $conn->prepare("SELECT COUNT(*) as count FROM users");
    $stmt->execute();
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();
    $results['user_count'] = $row['count'];
    
    $results['status'] = 'SUCCESS';
    $results['message'] = 'Database connection and schema verification complete';
    
    echo json_encode($results, JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    echo json_encode([
        'status' => 'ERROR',
        'message' => $e->getMessage(),
        'database_connection' => 'FAILED'
    ], JSON_PRETTY_PRINT);
}

?>

