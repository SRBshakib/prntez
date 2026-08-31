<?php
require_once 'config.php';

$action = $_GET['action'] ?? '';
$ip = getClientIP();

switch ($action) {
    case 'get':
        if (!checkRateLimit($ip, 'job_get', 30, 60)) {
            jsonError('Too many requests', 429);
        }
        $job_code = sanitize($_REQUEST['job_code'] ?? '');
        $shop_id = sanitize($_REQUEST['shop_id'] ?? ''); // can be id or qr_slug
        
        if (!$job_code || !$shop_id) jsonError('Missing parameters');
        
        $db = getDB();
        $stmt = $db->prepare("SELECT id FROM shops WHERE id = ? OR qr_slug = ?");
        $stmt->execute([$shop_id, $shop_id]);
        $shop_id_actual = $stmt->fetchColumn();
        
        if (!$shop_id_actual) jsonError('Shop not found');
        
        $stmt = $db->prepare("SELECT * FROM print_jobs WHERE job_code = ? AND shop_id = ?");
        $stmt->execute([$job_code, $shop_id_actual]);
        $job = $stmt->fetch();
        
        if (!$job) jsonError('Job not found');
        
        $files = [];
        if (!$job['files_deleted']) {
            $stmt = $db->prepare("SELECT id, original_name, file_type, file_size, copies, color_mode, paper_size, sides, upload_status, is_saved_to_library FROM print_files WHERE job_id = ?");
            $stmt->execute([$job['id']]);
            $files = $stmt->fetchAll();
        }
        
        jsonResponse(['success' => true, 'data' => ['job' => $job, 'files' => $files]]);
        break;

    case 'list':
        $shop = requireShopAuth();
        $status = sanitize($_GET['status'] ?? 'all');
        $limit = (int)($_GET['limit'] ?? 50);
        $offset = (int)($_GET['offset'] ?? 0);
        
        $db = getDB();
        $query = "SELECT * FROM print_jobs WHERE shop_id = ?";
        $params = [$shop['id']];
        
        if (in_array($status, ['pending', 'printing', 'done', 'cancelled'])) {
            $query .= " AND status = ?";
            $params[] = $status;
        }
        
        $query .= " ORDER BY created_at DESC LIMIT $limit OFFSET $offset";
        $stmt = $db->prepare($query);
        $stmt->execute($params);
        $jobs = $stmt->fetchAll();
        
        jsonResponse(['success' => true, 'data' => $jobs]);
        break;

    case 'update_status':
        $shop = requireShopAuth();
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonError('Invalid method');

        $job_id = (int)($_POST['job_id'] ?? 0);
        $status = sanitize($_POST['status'] ?? '');

        if (!in_array($status, ['pending', 'printing', 'done', 'cancelled'])) {
            jsonError('Invalid status');
        }

        $db = getDB();

        // Verify job belongs to this shop
        $stmt = $db->prepare("SELECT id, files_deleted FROM print_jobs WHERE id = ? AND shop_id = ?");
        $stmt->execute([$job_id, $shop['id']]);
        $job = $stmt->fetch();
        if (!$job) jsonError('Job not found');

        // Update status
        $stmt = $db->prepare("UPDATE print_jobs SET status = ? WHERE id = ?");
        $stmt->execute([$status, $job_id]);

        // If marked done AND delete_on_print setting is enabled AND files not already deleted
        $deleted = false;
        if ($status === 'done' && !$job['files_deleted']) {
            $deleteOnPrint = getSetting('delete_on_print', '1');
            if ($deleteOnPrint === '1') {
                // Get all file paths for this job
                $stmt = $db->prepare("SELECT stored_path FROM print_files WHERE job_id = ?");
                $stmt->execute([$job_id]);
                $filePaths = $stmt->fetchAll(PDO::FETCH_COLUMN);

                // Delete each file from disk
                foreach ($filePaths as $path) {
                    if ($path && file_exists($path)) {
                        @unlink($path);
                    }
                }

                // Delete the job directory if empty
                $jobDir = UPLOAD_TEMP_DIR . $job_id . '/';
                if (is_dir($jobDir)) {
                    @rmdir($jobDir); // only removes if empty
                }

                // Mark files as deleted in DB (keep record/history)
                $stmt = $db->prepare("UPDATE print_jobs SET files_deleted = 1 WHERE id = ?");
                $stmt->execute([$job_id]);
                $deleted = true;
            }
        }

        jsonResponse(['success' => true, 'files_deleted' => $deleted]);
        break;


    case 'track':
        $job_code = sanitize($_GET['job_code'] ?? '');
        $shop_slug = sanitize($_GET['shop_slug'] ?? '');
        
        $db = getDB();
        if ($shop_slug) {
            $stmt = $db->prepare("SELECT j.status, j.created_at, j.expires_at, j.files_deleted, s.name as shop_name, j.id as job_id FROM print_jobs j JOIN shops s ON j.shop_id = s.id WHERE j.job_code = ? AND s.qr_slug = ?");
            $stmt->execute([$job_code, $shop_slug]);
        } else if (isset($_SESSION['customer_id'])) {
            $stmt = $db->prepare("SELECT j.status, j.created_at, j.expires_at, j.files_deleted, s.name as shop_name, j.id as job_id FROM print_jobs j JOIN shops s ON j.shop_id = s.id WHERE j.job_code = ? AND j.customer_id = ?");
            $stmt->execute([$job_code, $_SESSION['customer_id']]);
        } else {
            jsonError('Missing shop information');
        }
        
        $job = $stmt->fetch();
        if (!$job) jsonError('Job not found');
        
        $file_names = [];
        if (!$job['files_deleted']) {
            $stmt = $db->prepare("SELECT original_name FROM print_files WHERE job_id = ?");
            $stmt->execute([$job['job_id']]);
            $file_names = $stmt->fetchAll(PDO::FETCH_COLUMN);
        }
        
        $job['file_names'] = $file_names;
        unset($job['job_id']);
        jsonResponse(['success' => true, 'data' => $job]);
        break;

    case 'customer_history':
        $customer = requireCustomerAuth();
        $limit = (int)($_GET['limit'] ?? 20);
        $offset = (int)($_GET['offset'] ?? 0);
        
        $db = getDB();
        $stmt = $db->prepare("SELECT j.id, j.job_code, j.status, j.created_at, j.total_files, s.name as shop_name FROM print_jobs j JOIN shops s ON j.shop_id = s.id WHERE j.customer_id = ? ORDER BY j.created_at DESC LIMIT $limit OFFSET $offset");
        $stmt->execute([$customer['id']]);
        $jobs = $stmt->fetchAll();
        
        jsonResponse(['success' => true, 'data' => $jobs]);
        break;

    default:
        jsonError('Invalid action');
}
