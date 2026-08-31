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

while (true) {
    if (connection_aborted()) {
        break;
    }
    
    // Max execution time ~25s for typical PHP-FPM setups to avoid 504 timeouts
    if (time() - $start_time > 25) {
        break;
    }

    $stmt = $db->prepare("SELECT id, job_code, customer_name, total_files, status, created_at FROM print_jobs WHERE shop_id = ? AND id > ? ORDER BY id ASC");
    $stmt->execute([$shop_id, $last_id]);
    $new_jobs = $stmt->fetchAll();
    
    foreach ($new_jobs as $job) {
        echo "event: new_job\n";
        echo "data: " . json_encode($job) . "\n\n";
        $last_id = $job['id'];
        flush();
    }
    
    // Also we could check for status updates, but SSE is mainly for new jobs
    
    echo "event: heartbeat\n";
    echo "data: " . json_encode(['time' => time()]) . "\n\n";
    flush();
    
    sleep(2);
}
