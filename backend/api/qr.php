<?php
require_once __DIR__ . '/../helpers/cors.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/jwt.php';
require_once __DIR__ . '/../config/database.php';

$auth = requireAuth();
$pdo = getConnection();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendJson(['error' => 'Method not allowed'], 405);
}

$reportId = isset($_GET['report_id']) ? (int) $_GET['report_id'] : 0;
if ($reportId <= 0) {
    sendJson(['error' => 'A valid report is required'], 400);
}

$stmt = $pdo->prepare('SELECT report_id, user_id, report_type FROM item_reports WHERE report_id = ?');
$stmt->execute([$reportId]);
$report = $stmt->fetch();

if (!$report) {
    sendJson(['error' => 'Report not found'], 404);
}
if ((int) $report['user_id'] !== (int) $auth['user_id'] || $report['report_type'] !== 'found') {
    sendJson(['error' => 'Only the finder can view the QR code of a found item'], 403);
}

// Reuse the saved QR link if there is one, otherwise create it
$stmt = $pdo->prepare('SELECT qr_code_url FROM qr_codes WHERE report_id = ?');
$stmt->execute([$reportId]);
$existing = $stmt->fetch();

if ($existing) {
    sendJson(['qr_code_url' => $existing['qr_code_url']]);
}

$config = require __DIR__ . '/../config/config.php';
$url = rtrim($config['allowed_origin'], '/') . '/item/' . $reportId;

$stmt = $pdo->prepare('INSERT INTO qr_codes (report_id, qr_code_url) VALUES (?, ?)');
$stmt->execute([$reportId, $url]);

sendJson(['qr_code_url' => $url]);