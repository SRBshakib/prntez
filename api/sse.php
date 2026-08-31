<?php
require_once 'config.php';
requireShopAuth();

header('Content-Type: text/event-stream');
header('Cache-Control: no-cache');
header('Connection: keep-alive');
// NGINX/Apache output buffering bypass
header('X-Accel-Buffering: no');
while (ob_get_level() > 0) ob_end_flush();
flush();

$shop_id = $_SESSION['shop_id'];
$db = getDB();

$last_id = (int)($_GET['last_id'] ?? 0);
$start_time = time();
$last_check_time = date('Y-m-d H:i:s', time() - 5);

while (true) {
    if (connection_aborted()) {
        break;
    }
    
    // Max execution time ~25s for typical PHP-FPM setups to avoid 504 timeouts
    if (time() - $start_time > 25) {
        break;
    }

    // 1. Check for new jobs
    $stmt = $db->prepare("SELECT id, job_code, customer_name, customer_phone, global_notes, total_files, status, created_at, updated_at FROM print_jobs WHERE shop_id = ? AND id > ? ORDER BY id ASC");
    $stmt->execute([$shop_id, $last_id]);
    $new_jobs = $stmt->fetchAll();
    
    foreach ($new_jobs as $job) {
        $stmt_f = $db->prepare("SELECT id, job_id, original_name, file_type, file_size, copies, color_mode, paper_size, sides, upload_status, is_saved_to_library FROM print_files WHERE job_id = ?");
        $stmt_f->execute([$job['id']]);
        $job['files'] = $stmt_f->fetchAll();
        
        echo "event: new_job\n";
        echo "data: " . json_encode($job) . "\n\n";
        $last_id = $job['id'];
        flush();
    }
    
    // 2. Check for updated jobs (e.g. files finished uploading or status changed)
    $current_check_time = date('Y-m-d H:i:s');
    $stmt_up = $db->prepare("SELECT id, job_code, customer_name, customer_phone, global_notes, total_files, status, created_at, updated_at FROM print_jobs WHERE shop_id = ? AND id <= ? AND updated_at >= ? ORDER BY updated_at ASC");
    $stmt_up->execute([$shop_id, $last_id, $last_check_time]);
    $updated_jobs = $stmt_up->fetchAll();
    
    foreach ($updated_jobs as $job) {
        $stmt_f = $db->prepare("SELECT id, job_id, original_name, file_type, file_size, copies, color_mode, paper_size, sides, upload_status, is_saved_to_library FROM print_files WHERE job_id = ?");
        $stmt_f->execute([$job['id']]);
        $job['files'] = $stmt_f->fetchAll();
        
        echo "event: job_updated\n";
        echo "data: " . json_encode($job) . "\n\n";
        flush();
    }
    $last_check_time = $current_check_time;
    
    echo "event: heartbeat\n";
    echo "data: " . json_encode(['time' => time()]) . "\n\n";
    flush();
    
    sleep(2);
}
