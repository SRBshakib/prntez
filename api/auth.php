<?php
require_once 'config.php';

$action = $_GET['action'] ?? '';
$ip = getClientIP();

if ($_SERVER['REQUEST_METHOD'] !== 'POST' && !in_array($action, ['shop_me', 'customer_me'])) {
    jsonError('Invalid method');
}

switch ($action) {
    case 'shop_register':
        $name = sanitize($_POST['name'] ?? '');
        $owner_name = sanitize($_POST['owner_name'] ?? '');
        $email = sanitize($_POST['email'] ?? '');
        $password = $_POST['password'] ?? '';
        $phone = sanitize($_POST['phone'] ?? '');
        $address = sanitize($_POST['address'] ?? '');
        $area = sanitize($_POST['area'] ?? '');
        $city = sanitize($_POST['city'] ?? '');
        
        if (!$name || !$owner_name || !$email || !$password) {
            jsonError('Missing required fields');
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            jsonError('Invalid email format');
        }
        if (strlen($password) < 8) {
            jsonError('Password must be at least 8 characters');
        }
        
        $db = getDB();
        $stmt = $db->prepare("SELECT id FROM shops WHERE email = ?");
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            jsonError('Email already registered');
        }
        
        $hash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
        $qr_slug = 'sh_' . substr(str_shuffle("0123456789abcdefghijklmnopqrstuvwxyz"), 0, 8);
        
        $stmt = $db->prepare("INSERT INTO shops (name, owner_name, email, password_hash, phone, address, area, city, qr_slug) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$name, $owner_name, $email, $hash, $phone, $address, $area, $city, $qr_slug]);
        
        $shop_id = $db->lastInsertId();
        $_SESSION['shop_id'] = $shop_id;
        $_SESSION['shop_name'] = $name;
        
        jsonResponse(['success' => true, 'data' => ['id' => $shop_id, 'name' => $name, 'email' => $email, 'qr_slug' => $qr_slug]]);
        break;

    case 'shop_login':
        if (!checkRateLimit($ip, 'shop_login', 5, 900)) {
            jsonError('Too many login attempts. Try again in 15 minutes.', 429);
        }
        $email = sanitize($_POST['email'] ?? '');
        $password = $_POST['password'] ?? '';
        
        $db = getDB();
        $stmt = $db->prepare("SELECT * FROM shops WHERE email = ?");
        $stmt->execute([$email]);
        $shop = $stmt->fetch();
        
        if ($shop && password_verify($password, $shop['password_hash'])) {
            if ($shop['status'] === 'suspended') {
                jsonError('Account suspended');
            }
            $_SESSION['shop_id'] = $shop['id'];
            $_SESSION['shop_name'] = $shop['name'];
            unset($shop['password_hash']);
            jsonResponse(['success' => true, 'data' => $shop]);
        }
        jsonError('Invalid credentials');
        break;

    case 'shop_logout':
        unset($_SESSION['shop_id']);
        unset($_SESSION['shop_name']);
        jsonResponse(['success' => true]);
        break;

    case 'shop_me':
        $shop = requireShopAuth();
        unset($shop['password_hash']);
        jsonResponse(['success' => true, 'data' => $shop]);
        break;

    case 'customer_register':
        $name = sanitize($_POST['name'] ?? '');
        $email = sanitize($_POST['email'] ?? '');
        $password = $_POST['password'] ?? '';
        $phone = sanitize($_POST['phone'] ?? '');
        
        if (!$name || !$email || !$password) {
            jsonError('Missing required fields');
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            jsonError('Invalid email format');
        }
        if (strlen($password) < 6) {
            jsonError('Password must be at least 6 characters');
        }
        
        $db = getDB();
        $stmt = $db->prepare("SELECT id FROM customers WHERE email = ?");
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            jsonError('Email already registered');
        }
        
        $hash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
        $stmt = $db->prepare("INSERT INTO customers (name, email, password_hash, phone) VALUES (?, ?, ?, ?)");
        $stmt->execute([$name, $email, $hash, $phone]);
        
        $customer_id = $db->lastInsertId();
        $_SESSION['customer_id'] = $customer_id;
        $_SESSION['customer_name'] = $name;
        
        jsonResponse(['success' => true, 'data' => ['id' => $customer_id, 'name' => $name, 'email' => $email]]);
        break;

    case 'customer_login':
        if (!checkRateLimit($ip, 'customer_login', 5, 900)) {
            jsonError('Too many login attempts.', 429);
        }
        $email = sanitize($_POST['email'] ?? '');
        $password = $_POST['password'] ?? '';
        
        $db = getDB();
        $stmt = $db->prepare("SELECT * FROM customers WHERE email = ?");
        $stmt->execute([$email]);
        $customer = $stmt->fetch();
        
        if ($customer && password_verify($password, $customer['password_hash'])) {
            $_SESSION['customer_id'] = $customer['id'];
            $_SESSION['customer_name'] = $customer['name'];
            unset($customer['password_hash']);
            jsonResponse(['success' => true, 'data' => $customer]);
        }
        jsonError('Invalid credentials');
        break;

    case 'customer_logout':
        unset($_SESSION['customer_id']);
        unset($_SESSION['customer_name']);
        jsonResponse(['success' => true]);
        break;

    case 'customer_me':
        if (isset($_SESSION['customer_id'])) {
            $customer = requireCustomerAuth();
            unset($customer['password_hash']);
            jsonResponse(['success' => true, 'data' => $customer]);
        }
        jsonResponse(['success' => true, 'data' => null]);
        break;
        
    case 'admin_login':
        if (!checkRateLimit($ip, 'admin_login', 3, 900)) {
            jsonError('Too many login attempts.', 429);
        }
        $password = $_POST['password'] ?? '';
        if ($password === getSetting('admin_password')) {
            $_SESSION['is_admin'] = true;
            jsonResponse(['success' => true]);
        }
        jsonError('Invalid credentials');
        break;
        
    case 'admin_logout':
        unset($_SESSION['is_admin']);
        jsonResponse(['success' => true]);
        break;

    default:
        jsonError('Invalid action');
}
