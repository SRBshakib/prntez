<?php
error_reporting(0);
session_start();

define('DB_HOST', 'localhost');
define('DB_NAME', 'prntez');
define('DB_USER', 'root');
define('DB_PASS', '');

define('UPLOAD_TEMP_DIR', dirname(__DIR__) . '/uploads/temp/');
define('UPLOAD_LIBRARY_DIR', dirname(__DIR__) . '/uploads/library/');
define('UPLOAD_LOGOS_DIR', dirname(__DIR__) . '/uploads/logos/');
define('UPLOAD_CHUNKS_DIR', dirname(__DIR__) . '/uploads/chunks/');

define('MAX_FILE_SIZE_MB', 50);
define('FILE_EXPIRY_MINUTES', 30);

// Ensure directories exist
$dirs = [UPLOAD_TEMP_DIR, UPLOAD_LIBRARY_DIR, UPLOAD_LOGOS_DIR, UPLOAD_CHUNKS_DIR];
foreach ($dirs as $dir) {
    if (!file_exists($dir)) {
        mkdir($dir, 0755, true);
    }
}

function setCorsHeaders() {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
    header('X-Frame-Options: DENY');
    header('X-Content-Type-Options: nosniff');
    header('X-XSS-Protection: 1; mode=block');
    
    if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
        exit(0);
    }
}
setCorsHeaders();

function getDB() {
    static $db = null;
    if ($db === null) {
        try {
            $db = new PDO('mysql:host='.DB_HOST.';dbname='.DB_NAME.';charset=utf8mb4', DB_USER, DB_PASS);
            $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            jsonError('Database connection failed', 500);
        }
    }
    return $db;
}

function jsonResponse($data, $code = 200) {
    http_response_code($code);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

function jsonError($msg, $code = 400) {
    jsonResponse(['success' => false, 'error' => $msg], $code);
}

function requireShopAuth() {
    if (!isset($_SESSION['shop_id'])) {
        jsonError('Unauthorized shop', 401);
    }
    $db = getDB();
    $stmt = $db->prepare("SELECT * FROM shops WHERE id = ? AND status != 'suspended'");
    $stmt->execute([$_SESSION['shop_id']]);
    $shop = $stmt->fetch();
    if (!$shop) {
        unset($_SESSION['shop_id']);
        unset($_SESSION['shop_name']);
        jsonError('Shop inactive or unauthorized', 401);
    }
    return $shop;
}

function requireCustomerAuth() {
    if (!isset($_SESSION['customer_id'])) {
        jsonError('Unauthorized customer', 401);
    }
    $db = getDB();
    $stmt = $db->prepare("SELECT * FROM customers WHERE id = ?");
    $stmt->execute([$_SESSION['customer_id']]);
    $customer = $stmt->fetch();
    if (!$customer) {
        unset($_SESSION['customer_id']);
        unset($_SESSION['customer_name']);
        jsonError('Customer not found', 401);
    }
    return $customer;
}

function requireAdmin() {
    if (!isset($_SESSION['is_admin']) || $_SESSION['is_admin'] !== true) {
        jsonError('Forbidden', 403);
    }
}

function sanitize($val) {
    if (is_string($val)) {
        return htmlspecialchars(trim($val), ENT_QUOTES, 'UTF-8');
    }
    return $val;
}

function getClientIP() {
    if (!empty($_SERVER['HTTP_CLIENT_IP'])) {
        $ip = $_SERVER['HTTP_CLIENT_IP'];
    } elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        $ip = $_SERVER['HTTP_X_FORWARDED_FOR'];
        $ip = explode(',', $ip)[0];
    } else {
        $ip = $_SERVER['REMOTE_ADDR'];
    }
    return $ip;
}

function checkRateLimit($ip, $action, $maxAttempts, $windowSeconds) {
    $db = getDB();
    $db->prepare("DELETE FROM rate_limits WHERE window_start < DATE_SUB(NOW(), INTERVAL ? SECOND)")
       ->execute([$windowSeconds]);
       
    $stmt = $db->prepare("SELECT attempts FROM rate_limits WHERE ip = ? AND action = ?");
    $stmt->execute([$ip, $action]);
    $row = $stmt->fetch();
    
    if ($row) {
        if ($row['attempts'] >= $maxAttempts) {
            return false;
        }
        $db->prepare("UPDATE rate_limits SET attempts = attempts + 1 WHERE ip = ? AND action = ?")
           ->execute([$ip, $action]);
    } else {
        $db->prepare("INSERT INTO rate_limits (ip, action, attempts) VALUES (?, ?, 1)")
           ->execute([$ip, $action]);
    }
    return true;
}

function getSetting($key, $default = '') {
    $db = getDB();
    $stmt = $db->prepare("SELECT value FROM settings WHERE `key` = ?");
    $stmt->execute([$key]);
    $row = $stmt->fetch();
    return $row ? $row['value'] : $default;
}
