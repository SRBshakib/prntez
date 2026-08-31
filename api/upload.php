<?php
require_once 'config.php';

$action = $_GET['action'] ?? '';
$ip = getClientIP();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonError('Invalid method');
}

switch ($action) {
    case 'init_job':
        if (!checkRateLimit($ip, 'upload_job', 10, 3600)) {
            jsonError('Too many upload jobs. Please try again later.', 429);
        }
        
        $shop_id = (int)($_POST['shop_id'] ?? 0);
        $customer_name = sanitize($_POST['customer_name'] ?? '');
        $customer_phone = sanitize($_POST['customer_phone'] ?? '');
        $global_notes = sanitize($_POST['global_notes'] ?? '');
        $file_count = (int)($_POST['file_count'] ?? 0);
        
        if (!$shop_id) jsonError('Missing shop_id');
        
        $db = getDB();
        
        // Verify shop exists and is active
        $stmt = $db->prepare("SELECT id FROM shops WHERE id = ? AND status = 'active'");
        $stmt->execute([$shop_id]);
        if (!$stmt->fetch()) jsonError('Shop not available');
        
        $customer_id = $_SESSION['customer_id'] ?? null;
        if ($customer_id && !$customer_name) {
            $customer = requireCustomerAuth();
            $customer_name = $customer['name'];
            $customer_phone = $customer['phone'];
        }
        
        $today = date('Y-m-d');
        try {
            $db->beginTransaction();
            $stmt = $db->prepare("INSERT INTO job_daily_sequence (shop_id, date, last_seq) VALUES (?, ?, 1) ON DUPLICATE KEY UPDATE last_seq = last_seq + 1");
            $stmt->execute([$shop_id, $today]);
            
            $stmt = $db->prepare("SELECT last_seq FROM job_daily_sequence WHERE shop_id = ? AND date = ?");
            $stmt->execute([$shop_id, $today]);
            $seq = $stmt->fetchColumn();
            
            if ($seq > 9999) {
                $stmt = $db->prepare("UPDATE job_daily_sequence SET last_seq = 1 WHERE shop_id = ? AND date = ?");
                $stmt->execute([$shop_id, $today]);
                $seq = 1;
            }
            $job_code = str_pad($seq, 4, '0', STR_PAD_LEFT);
            
            $expires_at = date('Y-m-d H:i:s', strtotime('+' . getSetting('file_expiry_minutes', 30) . ' minutes'));
            
            $stmt = $db->prepare("INSERT INTO print_jobs (job_code, shop_id, customer_id, customer_name, customer_phone, global_notes, expires_at, total_files) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([$job_code, $shop_id, $customer_id, $customer_name, $customer_phone, $global_notes, $expires_at, $file_count]);
            
            $job_id = $db->lastInsertId();
            $db->commit();
            
            jsonResponse(['success' => true, 'data' => ['job_id' => $job_id, 'job_code' => $job_code, 'expires_at' => $expires_at]]);
        } catch (Exception $e) {
            $db->rollBack();
            jsonError('Failed to initialize job');
        }
        break;

    case 'upload_chunk':
        $upload_id = sanitize($_POST['upload_id'] ?? '');
        $job_id = (int)($_POST['job_id'] ?? 0);
        $file_index = (int)($_POST['file_index'] ?? 0);
        $original_name = sanitize($_POST['original_name'] ?? '');
        $chunk_index = (int)($_POST['chunk_index'] ?? 0);
        $total_chunks = (int)($_POST['total_chunks'] ?? 0);
        
        if (!$upload_id || !$job_id || !isset($_FILES['chunk'])) {
            jsonError('Missing required fields');
        }
        
        $db = getDB();
        $stmt = $db->prepare("SELECT id FROM print_jobs WHERE id = ? AND expires_at > NOW() AND files_deleted = 0");
        $stmt->execute([$job_id]);
        if (!$stmt->fetch()) jsonError('Job expired or invalid');
        
        if ($_FILES['chunk']['size'] > 5 * 1024 * 1024) {
            jsonError('Chunk too large (max 5MB)');
        }
        
        if ($chunk_index === 0) {
            $stmt = $db->prepare("INSERT IGNORE INTO upload_chunks (upload_id, job_id, file_index, original_name, total_chunks) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$upload_id, $job_id, $file_index, $original_name, $total_chunks]);
        }
        
        $chunk_dir = UPLOAD_CHUNKS_DIR . $upload_id . '/';
        if (!file_exists($chunk_dir)) {
            mkdir($chunk_dir, 0755, true);
        }
        
        $temp_file = $chunk_dir . 'file.tmp';
        $out = fopen($temp_file, $chunk_index == 0 ? 'wb' : 'ab');
        if ($out) {
            $in = fopen($_FILES['chunk']['tmp_name'], 'rb');
            if ($in) {
                while ($buff = fread($in, 4096)) {
                    fwrite($out, $buff);
                }
            } else {
                jsonError('Failed to read uploaded chunk');
            }
            fclose($in);
            fclose($out);
        } else {
            jsonError('Failed to open temp file for writing');
        }
        
        $stmt = $db->prepare("UPDATE upload_chunks SET received_chunks = received_chunks + 1 WHERE upload_id = ?");
        $stmt->execute([$upload_id]);
        
        $stmt = $db->prepare("SELECT received_chunks FROM upload_chunks WHERE upload_id = ?");
        $stmt->execute([$upload_id]);
        $received = $stmt->fetchColumn();
        
        jsonResponse(['success' => true, 'chunk_index' => $chunk_index, 'received' => $received, 'total' => $total_chunks]);
        break;

    case 'complete_file':
        $upload_id = sanitize($_POST['upload_id'] ?? '');
        $job_id = (int)($_POST['job_id'] ?? 0);
        $copies = (int)($_POST['copies'] ?? 1);
        $color_mode = $_POST['color_mode'] === 'color' ? 'color' : 'bw';
        $paper_size = in_array($_POST['paper_size'] ?? '', ['A4','A3','Letter','Legal']) ? $_POST['paper_size'] : 'A4';
        $sides = $_POST['sides'] === 'double' ? 'double' : 'single';
        $save_to_library = (int)($_POST['save_to_library'] ?? 0);
        
        $db = getDB();
        $stmt = $db->prepare("SELECT * FROM upload_chunks WHERE upload_id = ? AND job_id = ?");
        $stmt->execute([$upload_id, $job_id]);
        $upload = $stmt->fetch();
        
        if (!$upload || $upload['received_chunks'] < $upload['total_chunks']) {
            jsonError('Incomplete upload');
        }
        
        $chunk_dir = UPLOAD_CHUNKS_DIR . $upload_id . '/';
        $temp_file = $chunk_dir . 'file.tmp';
        
        if (!file_exists($temp_file)) jsonError('File missing on server');
        
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mime = finfo_file($finfo, $temp_file);
        finfo_close($finfo);
        
        $allowed_mimes = [
            'application/pdf', 'image/jpeg', 'image/png', 'image/gif', 
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
        if (!in_array($mime, $allowed_mimes)) {
            @unlink($temp_file);
            @rmdir($chunk_dir);
            jsonError('Invalid file type');
        }
        
        $ext = pathinfo($upload['original_name'], PATHINFO_EXTENSION);
        if (!in_array(strtolower($ext), ['pdf','jpg','jpeg','png','gif','docx'])) {
            @unlink($temp_file);
            @rmdir($chunk_dir);
            jsonError('Invalid file extension');
        }
        
        $file_size = filesize($temp_file);
        if ($file_size > getSetting('max_file_size_mb', 50) * 1024 * 1024) {
            @unlink($temp_file);
            @rmdir($chunk_dir);
            jsonError('File too large');
        }
        
        $job_dir = UPLOAD_TEMP_DIR . $job_id . '/';
        if (!file_exists($job_dir)) mkdir($job_dir, 0755, true);
        
        $final_filename = $upload_id . '.' . $ext;
        $final_path = $job_dir . $final_filename;
        
        rename($temp_file, $final_path);
        @rmdir($chunk_dir);
        
        $db->beginTransaction();
        try {
            $stmt = $db->prepare("INSERT INTO print_files (job_id, original_name, stored_path, file_type, file_size, copies, color_mode, paper_size, sides, upload_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'done')");
            $stmt->execute([$job_id, $upload['original_name'], $final_path, $ext, $file_size, $copies, $color_mode, $paper_size, $sides]);
            $file_id = $db->lastInsertId();
            
            $library_file_id = null;
            if ($save_to_library && isset($_SESSION['customer_id'])) {
                $customer_id = $_SESSION['customer_id'];
                $lib_dir = UPLOAD_LIBRARY_DIR . $customer_id . '/';
                if (!file_exists($lib_dir)) mkdir($lib_dir, 0755, true);
                $lib_path = $lib_dir . $final_filename;
                
                copy($final_path, $lib_path);
                
                $stmt = $db->prepare("INSERT INTO library_files (customer_id, original_name, stored_path, file_type, file_size) VALUES (?, ?, ?, ?, ?)");
                $stmt->execute([$customer_id, $upload['original_name'], $lib_path, $ext, $file_size]);
                $library_file_id = $db->lastInsertId();
                
                $stmt = $db->prepare("UPDATE print_files SET is_saved_to_library = 1, library_file_id = ? WHERE id = ?");
                $stmt->execute([$library_file_id, $file_id]);
                
                $stmt = $db->prepare("UPDATE customers SET storage_used = storage_used + ? WHERE id = ?");
                $stmt->execute([$file_size, $customer_id]);
            }
            
            $stmt = $db->prepare("DELETE FROM upload_chunks WHERE upload_id = ?");
            $stmt->execute([$upload_id]);
            
            $db->commit();
            jsonResponse(['success' => true, 'data' => ['file_id' => $file_id, 'file_name' => $upload['original_name'], 'file_size' => $file_size, 'file_type' => $ext]]);
        } catch (Exception $e) {
            $db->rollBack();
            jsonError('Failed to complete file upload');
        }
        break;

    case 'cancel_file':
        $upload_id = sanitize($_POST['upload_id'] ?? '');
        $job_id = (int)($_POST['job_id'] ?? 0);
        
        $chunk_dir = UPLOAD_CHUNKS_DIR . $upload_id . '/';
        if (file_exists($chunk_dir)) {
            @unlink($chunk_dir . 'file.tmp');
            @rmdir($chunk_dir);
        }
        
        $db = getDB();
        $stmt = $db->prepare("DELETE FROM upload_chunks WHERE upload_id = ? AND job_id = ?");
        $stmt->execute([$upload_id, $job_id]);
        
        jsonResponse(['success' => true]);
        break;

    default:
        jsonError('Invalid action');
}
