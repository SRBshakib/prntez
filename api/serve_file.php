<?php
require_once 'config.php';

$file_id = (int)($_GET['file_id'] ?? 0);
$library_file_id = (int)($_GET['library_file_id'] ?? 0);

if (!$file_id && !$library_file_id) {
    http_response_code(400);
    exit('Missing file reference');
}

$db = getDB();
$path = '';
$mime = 'application/octet-stream';
$original_name = 'file';

if ($file_id) {
    $stmt = $db->prepare("
        SELECT f.stored_path, f.original_name, f.file_type, j.shop_id, j.expires_at, j.files_deleted 
        FROM print_files f 
        JOIN print_jobs j ON f.job_id = j.id 
        WHERE f.id = ?
    ");
    $stmt->execute([$file_id]);
    $file = $stmt->fetch();
    
    if (!$file || $file['files_deleted']) {
        http_response_code(404);
        exit('File not found or has been deleted');
    }
    
    $path = $file['stored_path'];
    $original_name = $file['original_name'];
    
} else if ($library_file_id) {
    if (!isset($_SESSION['customer_id'])) {
        http_response_code(401);
        exit('Unauthorized');
    }
    
    $stmt = $db->prepare("SELECT stored_path, original_name FROM library_files WHERE id = ? AND customer_id = ?");
    $stmt->execute([$library_file_id, $_SESSION['customer_id']]);
    $file = $stmt->fetch();
    
    if (!$file) {
        http_response_code(404);
        exit('File not found or access denied');
    }
    
    $path = $file['stored_path'];
    $original_name = $file['original_name'];
}

if (!file_exists($path)) {
    http_response_code(404);
    exit('File missing on server');
}

$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mime = finfo_file($finfo, $path);
finfo_close($finfo);

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Content-Type: ' . $mime);
header('Content-Disposition: inline; filename="' . basename($original_name) . '"');
header('Content-Length: ' . filesize($path));
header('Cache-Control: private, max-age=3600');

readfile($path);
exit;
