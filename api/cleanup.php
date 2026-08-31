<?php
require_once 'config.php';
// This can be run by cron or admin panel
// If called via web without admin session, maybe protect it, but it's safe to run anytime.

$db = getDB();

$deleted_jobs = 0;
$deleted_files = 0;
$freed_bytes = 0;

// Find expired jobs whose files are not yet deleted
$stmt = $db->prepare("SELECT id FROM print_jobs WHERE expires_at <= NOW() AND files_deleted = 0");
$stmt->execute();
$expired_jobs = $stmt->fetchAll(PDO::FETCH_COLUMN);

foreach ($expired_jobs as $job_id) {
    // We don't delete from print_files, we just delete actual files
    $f_stmt = $db->prepare("SELECT stored_path, file_size FROM print_files WHERE job_id = ?");
    $f_stmt->execute([$job_id]);
    $files = $f_stmt->fetchAll();
    
    foreach ($files as $f) {
        if (file_exists($f['stored_path'])) {
            @unlink($f['stored_path']);
            $deleted_files++;
            $freed_bytes += $f['file_size'];
        }
    }
    
    // Remove job dir
    $job_dir = UPLOAD_TEMP_DIR . $job_id . '/';
    if (file_exists($job_dir)) {
        @rmdir($job_dir);
    }
    
    $u_stmt = $db->prepare("UPDATE print_jobs SET files_deleted = 1 WHERE id = ?");
    $u_stmt->execute([$job_id]);
    
    $deleted_jobs++;
}

// Cleanup orphaned upload chunks older than 1 hour
$stmt = $db->prepare("SELECT upload_id FROM upload_chunks WHERE created_at < DATE_SUB(NOW(), INTERVAL 1 HOUR)");
$stmt->execute();
$orphans = $stmt->fetchAll(PDO::FETCH_COLUMN);

foreach ($orphans as $uid) {
    $chunk_dir = UPLOAD_CHUNKS_DIR . $uid . '/';
    if (file_exists($chunk_dir)) {
        array_map('unlink', glob("$chunk_dir/*"));
        @rmdir($chunk_dir);
    }
}
$db->query("DELETE FROM upload_chunks WHERE created_at < DATE_SUB(NOW(), INTERVAL 1 HOUR)");

// Cleanup rate limits
$db->query("DELETE FROM rate_limits WHERE window_start < DATE_SUB(NOW(), INTERVAL 1 HOUR)");

// Cleanup OTP codes
$db->query("DELETE FROM otp_codes WHERE expires_at < NOW() OR created_at < DATE_SUB(NOW(), INTERVAL 1 HOUR)");

$res = [
    'deleted_jobs' => $deleted_jobs,
    'deleted_files' => $deleted_files,
    'freed_bytes' => $freed_bytes
];

// If called directly via CLI or web (not included by admin.php)
if (basename(__FILE__) === basename($_SERVER['SCRIPT_FILENAME'] ?? '')) {
    header('Content-Type: application/json');
    echo json_encode($res);
} else {
    // When included by admin.php, output is captured via ob_start
    echo json_encode($res);
}
