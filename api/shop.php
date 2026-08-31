<?php
require_once 'config.php';

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'profile':
        $shop = requireShopAuth();
        unset($shop['password_hash']);
        jsonResponse(['success' => true, 'data' => $shop]);
        break;

    case 'update':
        $shop = requireShopAuth();
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonError('Invalid method');
        
        $name = sanitize($_POST['name'] ?? $shop['name']);
        $owner_name = sanitize($_POST['owner_name'] ?? $shop['owner_name']);
        $phone = sanitize($_POST['phone'] ?? $shop['phone']);
        $address = sanitize($_POST['address'] ?? $shop['address']);
        $area = sanitize($_POST['area'] ?? $shop['area']);
        $city = sanitize($_POST['city'] ?? $shop['city']);
        $operating_hours = sanitize($_POST['operating_hours'] ?? $shop['operating_hours']);
        $out_of_service = isset($_POST['out_of_service']) ? (int)$_POST['out_of_service'] : $shop['out_of_service'];
        $accepted_types = sanitize($_POST['accepted_types'] ?? $shop['accepted_types']);
        $max_file_size = (int)($_POST['max_file_size'] ?? $shop['max_file_size']);
        
        $logo_path = $shop['logo_path'];
        if (isset($_FILES['logo']) && $_FILES['logo']['error'] === UPLOAD_ERR_OK) {
            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            $mime = finfo_file($finfo, $_FILES['logo']['tmp_name']);
            finfo_close($finfo);
            
            if (in_array($mime, ['image/jpeg', 'image/png'])) {
                $ext = $mime === 'image/jpeg' ? 'jpg' : 'png';
                $dest = UPLOAD_LOGOS_DIR . $shop['id'] . '.' . $ext;
                if (move_uploaded_file($_FILES['logo']['tmp_name'], $dest)) {
                    $logo_path = 'uploads/logos/' . $shop['id'] . '.' . $ext;
                }
            }
        }
        
        $db = getDB();
        $stmt = $db->prepare("UPDATE shops SET name = ?, owner_name = ?, phone = ?, address = ?, area = ?, city = ?, operating_hours = ?, out_of_service = ?, accepted_types = ?, max_file_size = ?, logo_path = ? WHERE id = ?");
        $stmt->execute([$name, $owner_name, $phone, $address, $area, $city, $operating_hours, $out_of_service, $accepted_types, $max_file_size, $logo_path, $shop['id']]);
        
        $_SESSION['shop_name'] = $name;
        jsonResponse(['success' => true]);
        break;

    case 'change_password':
        $shop = requireShopAuth();
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonError('Invalid method');
        
        $current = $_POST['current_password'] ?? '';
        $new = $_POST['new_password'] ?? '';
        
        if (strlen($new) < 8) jsonError('New password too short');
        
        $db = getDB();
        $stmt = $db->prepare("SELECT password_hash FROM shops WHERE id = ?");
        $stmt->execute([$shop['id']]);
        $hash = $stmt->fetchColumn();
        
        if (!password_verify($current, $hash)) jsonError('Incorrect current password');
        
        $new_hash = password_hash($new, PASSWORD_BCRYPT, ['cost' => 12]);
        $stmt = $db->prepare("UPDATE shops SET password_hash = ? WHERE id = ?");
        $stmt->execute([$new_hash, $shop['id']]);
        
        jsonResponse(['success' => true]);
        break;

    case 'by_slug':
        $slug = sanitize($_GET['slug'] ?? '');
        if (!$slug) jsonError('Missing slug');
        
        $db = getDB();
        $stmt = $db->prepare("SELECT id, name, area, city, logo_path, operating_hours, out_of_service, status, accepted_types, max_file_size FROM shops WHERE qr_slug = ?");
        $stmt->execute([$slug]);
        $shop = $stmt->fetch();
        
        if (!$shop) jsonError('Shop not found');
        jsonResponse(['success' => true, 'data' => $shop]);
        break;

    case 'qr_data':
        $shop = requireShopAuth();
        $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' || $_SERVER['SERVER_PORT'] == 443) ? "https://" : "http://";
        $domainName = $_SERVER['HTTP_HOST'];
        $path = dirname(dirname($_SERVER['SCRIPT_NAME'])); // e.g. /printshare
        if ($path == '/' || $path == '\\') $path = '';
        
        $upload_url = $protocol . $domainName . $path . '/upload.html?shop=' . $shop['qr_slug'];
        
        jsonResponse(['success' => true, 'data' => ['qr_slug' => $shop['qr_slug'], 'upload_url' => $upload_url]]);
        break;

    case 'stats':
        $shop = requireShopAuth();
        $db = getDB();
        
        $today = date('Y-m-d');
        
        $stmt = $db->prepare("SELECT COUNT(*) FROM print_jobs WHERE shop_id = ? AND DATE(created_at) = ?");
        $stmt->execute([$shop['id'], $today]);
        $today_jobs = $stmt->fetchColumn();
        
        $stmt = $db->prepare("SELECT COUNT(*) FROM print_jobs WHERE shop_id = ? AND status = 'pending'");
        $stmt->execute([$shop['id']]);
        $pending_count = $stmt->fetchColumn();
        
        $stmt = $db->prepare("SELECT COUNT(*) FROM print_jobs WHERE shop_id = ?");
        $stmt->execute([$shop['id']]);
        $total_jobs = $stmt->fetchColumn();
        
        $stmt = $db->prepare("SELECT COUNT(*) FROM print_jobs WHERE shop_id = ? AND status = 'done' AND DATE(created_at) = ?");
        $stmt->execute([$shop['id'], $today]);
        $done_today = $stmt->fetchColumn();
        
        $stmt = $db->prepare("SELECT HOUR(created_at) as h, COUNT(*) as c FROM print_jobs WHERE shop_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR) GROUP BY HOUR(created_at)");
        $stmt->execute([$shop['id']]);
        $hourly_raw = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
        
        $hourly = [];
        for ($i=0; $i<24; $i++) {
            $hourly[$i] = $hourly_raw[$i] ?? 0;
        }
        
        jsonResponse(['success' => true, 'data' => [
            'today_jobs' => $today_jobs,
            'pending_count' => $pending_count,
            'total_jobs' => $total_jobs,
            'done_today' => $done_today,
            'hourly' => $hourly
        ]]);
        break;

    default:
        jsonError('Invalid action');
}
