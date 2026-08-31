<?php
require_once 'config.php';

$action = $_GET['action'] ?? '';

if (!in_array($action, ['login', 'logout'])) {
    requireAdmin();
}

switch ($action) {
    case 'stats':
        $db = getDB();
        
        $stmt = $db->query("SELECT status, COUNT(*) as c FROM shops GROUP BY status");
        $shop_counts = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
        $shops_active = $shop_counts['active'] ?? 0;
        $shops_pending = $shop_counts['pending'] ?? 0;
        $shops_suspended = $shop_counts['suspended'] ?? 0;
        
        $today = date('Y-m-d');
        $stmt = $db->prepare("SELECT COUNT(*) FROM print_jobs WHERE DATE(created_at) = ?");
        $stmt->execute([$today]);
        $jobs_today = $stmt->fetchColumn();
        
        $stmt = $db->query("SELECT COUNT(*) FROM print_jobs WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)");
        $jobs_week = $stmt->fetchColumn();
        
        $stmt = $db->query("SELECT COUNT(*), SUM(file_size) FROM print_files");
        $row = $stmt->fetch(PDO::FETCH_NUM);
        $files_count = $row[0] ?? 0;
        $files_size = $row[1] ?? 0;
        
        $stmt = $db->query("SELECT SUM(file_size) FROM library_files");
        $lib_size = $stmt->fetchColumn() ?? 0;
        
        $total_storage = $files_size + $lib_size;
        
        $stmt = $db->prepare("SELECT s.name, COUNT(j.id) as job_count FROM shops s JOIN print_jobs j ON s.id = j.shop_id WHERE DATE(j.created_at) = ? GROUP BY s.id ORDER BY job_count DESC LIMIT 5");
        $stmt->execute([$today]);
        $top_shops = $stmt->fetchAll();
        
        jsonResponse(['success' => true, 'data' => [
            'shops' => ['active' => $shops_active, 'pending' => $shops_pending, 'suspended' => $shops_suspended],
            'jobs' => ['today' => $jobs_today, 'week' => $jobs_week],
            'storage' => ['files_count' => $files_count, 'total_bytes' => $total_storage],
            'top_shops' => $top_shops
        ]]);
        break;

    case 'shops':
        $db = getDB();
        $search = sanitize($_GET['search'] ?? '');
        
        $query = "SELECT s.id, s.name, s.email, s.phone, s.area, s.status, s.created_at, (SELECT COUNT(*) FROM print_jobs WHERE shop_id = s.id) as total_jobs FROM shops s";
        $params = [];
        
        if ($search) {
            $query .= " WHERE s.name LIKE ? OR s.email LIKE ? OR s.area LIKE ?";
            $search_param = "%$search%";
            $params = [$search_param, $search_param, $search_param];
        }
        $query .= " ORDER BY s.created_at DESC";
        
        $stmt = $db->prepare($query);
        $stmt->execute($params);
        $shops = $stmt->fetchAll();
        
        jsonResponse(['success' => true, 'data' => $shops]);
        break;

    case 'update_shop':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonError('Invalid method');
        $shop_id = (int)($_POST['shop_id'] ?? 0);
        $status = sanitize($_POST['status'] ?? '');
        
        if (!in_array($status, ['active', 'pending', 'suspended'])) {
            jsonError('Invalid status');
        }
        
        $db = getDB();
        $stmt = $db->prepare("UPDATE shops SET status = ? WHERE id = ?");
        $stmt->execute([$status, $shop_id]);
        
        jsonResponse(['success' => true]);
        break;

    case 'delete_shop':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonError('Invalid method');
        $shop_id = (int)($_POST['shop_id'] ?? 0);
        
        $db = getDB();
        
        // Let DB cascading take care of records, but we need to delete files manually
        $stmt = $db->prepare("SELECT id FROM print_jobs WHERE shop_id = ?");
        $stmt->execute([$shop_id]);
        $jobs = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        foreach ($jobs as $jid) {
            $dir = UPLOAD_TEMP_DIR . $jid . '/';
            if (file_exists($dir)) {
                array_map('unlink', glob("$dir/*.*"));
                @rmdir($dir);
            }
        }
        
        $stmt = $db->prepare("DELETE FROM shops WHERE id = ?");
        $stmt->execute([$shop_id]);
        
        jsonResponse(['success' => true]);
        break;

    case 'settings':
        $db = getDB();
        $stmt = $db->query("SELECT `key`, value FROM settings");
        $settings = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
        jsonResponse(['success' => true, 'data' => $settings]);
        break;

    case 'update_settings':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonError('Invalid method');
        $db = getDB();
        $db->beginTransaction();
        try {
            $stmt = $db->prepare("UPDATE settings SET value = ? WHERE `key` = ?");
            foreach ($_POST as $key => $val) {
                // only update known keys or allow all?
                if ($key !== 'action') {
                    $stmt->execute([sanitize($val), $key]);
                }
            }
            $db->commit();
            jsonResponse(['success' => true]);
        } catch (Exception $e) {
            $db->rollBack();
            jsonError('Failed to update settings');
        }
        break;

    case 'force_cleanup':
        ob_start();
        include 'cleanup.php';
        $res = ob_get_clean();
        $data = json_decode($res, true);
        jsonResponse(['success' => true, 'data' => $data]);
        break;
        
    case 'jobs':
        $db = getDB();
        $status = sanitize($_GET['status'] ?? '');
        
        $query = "SELECT j.*, s.name as shop_name FROM print_jobs j JOIN shops s ON j.shop_id = s.id";
        $params = [];
        if ($status && in_array($status, ['pending', 'printing', 'done', 'cancelled'])) {
            $query .= " WHERE j.status = ?";
            $params[] = $status;
        }
        $query .= " ORDER BY j.created_at DESC LIMIT 100";
        
        $stmt = $db->prepare($query);
        $stmt->execute($params);
        $jobs = $stmt->fetchAll();
        
        jsonResponse(['success' => true, 'data' => $jobs]);
        break;

    default:
        jsonError('Invalid action');
}
