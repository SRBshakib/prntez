<?php
require_once 'config.php';

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'profile':
        $customer = requireCustomerAuth();
        unset($customer['password_hash']);
        jsonResponse(['success' => true, 'data' => $customer]);
        break;

    case 'update':
        $customer = requireCustomerAuth();
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonError('Invalid method');
        
        $name = sanitize($_POST['name'] ?? $customer['name']);
        $phone = sanitize($_POST['phone'] ?? $customer['phone']);
        
        $profile_photo = $customer['profile_photo'];
        if (isset($_FILES['photo']) && $_FILES['photo']['error'] === UPLOAD_ERR_OK) {
            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            $mime = finfo_file($finfo, $_FILES['photo']['tmp_name']);
            finfo_close($finfo);
            
            if (in_array($mime, ['image/jpeg', 'image/png'])) {
                $ext = $mime === 'image/jpeg' ? 'jpg' : 'png';
                $dest_dir = UPLOAD_LOGOS_DIR . 'customers/';
                if (!file_exists($dest_dir)) mkdir($dest_dir, 0755, true);
                $dest = $dest_dir . $customer['id'] . '.' . $ext;
                if (move_uploaded_file($_FILES['photo']['tmp_name'], $dest)) {
                    $profile_photo = 'uploads/logos/customers/' . $customer['id'] . '.' . $ext;
                }
            }
        }
        
        $db = getDB();
        $stmt = $db->prepare("UPDATE customers SET name = ?, phone = ?, profile_photo = ? WHERE id = ?");
        $stmt->execute([$name, $phone, $profile_photo, $customer['id']]);
        
        $_SESSION['customer_name'] = $name;
        jsonResponse(['success' => true]);
        break;

    case 'change_password':
        $customer = requireCustomerAuth();
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonError('Invalid method');
        
        $current = $_POST['current_password'] ?? '';
        $new = $_POST['new_password'] ?? '';
        
        if (strlen($new) < 6) jsonError('New password too short');
        
        $db = getDB();
        $stmt = $db->prepare("SELECT password_hash FROM customers WHERE id = ?");
        $stmt->execute([$customer['id']]);
        $hash = $stmt->fetchColumn();
        
        if (!password_verify($current, $hash)) jsonError('Incorrect current password');
        
        $new_hash = password_hash($new, PASSWORD_BCRYPT, ['cost' => 12]);
        $stmt = $db->prepare("UPDATE customers SET password_hash = ? WHERE id = ?");
        $stmt->execute([$new_hash, $customer['id']]);
        
        jsonResponse(['success' => true]);
        break;

    case 'history':
        $customer = requireCustomerAuth();
        $limit = (int)($_GET['limit'] ?? 20);
        $offset = (int)($_GET['offset'] ?? 0);
        
        $db = getDB();
        $stmt = $db->prepare("
            SELECT j.id, j.job_code, j.status, j.created_at, j.expires_at, j.total_files, s.name as shop_name 
            FROM print_jobs j 
            JOIN shops s ON j.shop_id = s.id 
            WHERE j.customer_id = ? 
            ORDER BY j.created_at DESC LIMIT $limit OFFSET $offset
        ");
        $stmt->execute([$customer['id']]);
        $jobs = $stmt->fetchAll();
        
        // Fetch files for these jobs
        foreach ($jobs as &$job) {
            $stmt = $db->prepare("SELECT original_name, file_type, file_size, copies, color_mode, paper_size, sides FROM print_files WHERE job_id = ?");
            $stmt->execute([$job['id']]);
            $job['files'] = $stmt->fetchAll();
        }
        
        jsonResponse(['success' => true, 'data' => $jobs]);
        break;

    case 'library':
        $customer = requireCustomerAuth();
        $db = getDB();
        $stmt = $db->prepare("SELECT id, original_name, file_type, file_size, created_at FROM library_files WHERE customer_id = ? ORDER BY created_at DESC");
        $stmt->execute([$customer['id']]);
        $files = $stmt->fetchAll();
        jsonResponse(['success' => true, 'data' => $files]);
        break;

    case 'delete_library_file':
        $customer = requireCustomerAuth();
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonError('Invalid method');
        
        $file_id = (int)($_POST['file_id'] ?? 0);
        $db = getDB();
        
        $stmt = $db->prepare("SELECT stored_path, file_size FROM library_files WHERE id = ? AND customer_id = ?");
        $stmt->execute([$file_id, $customer['id']]);
        $file = $stmt->fetch();
        
        if (!$file) jsonError('File not found');
        
        @unlink($file['stored_path']);
        
        $stmt = $db->prepare("DELETE FROM library_files WHERE id = ?");
        $stmt->execute([$file_id]);
        
        $stmt = $db->prepare("UPDATE customers SET storage_used = GREATEST(0, storage_used - ?) WHERE id = ?");
        $stmt->execute([$file['file_size'], $customer['id']]);
        
        jsonResponse(['success' => true]);
        break;

    case 'storage_info':
        $customer = requireCustomerAuth();
        $percentage = $customer['storage_limit'] > 0 ? min(100, round(($customer['storage_used'] / $customer['storage_limit']) * 100, 2)) : 0;
        
        jsonResponse(['success' => true, 'data' => [
            'storage_used' => (int)$customer['storage_used'],
            'storage_limit' => (int)$customer['storage_limit'],
            'percentage' => $percentage
        ]]);
        break;

    default:
        jsonError('Invalid action');
}
