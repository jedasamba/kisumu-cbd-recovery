<?php
require_once __DIR__ . '/../helpers/cors.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendJson(['error' => 'Method not allowed'], 405);
}

$reportId = isset($_GET['id']) ? (int) $_GET['id'] : 0;
if ($reportId <= 0) {
    sendJson(['error' => 'A valid item is required'], 400);
}

$pdo = getConnection();

// Only found items are public, and the private detail and owner info are never selected
$stmt = $pdo->prepare(
    "SELECT report_id, category, brand, colour, description, photo_url, status, created_at
     FROM item_reports
     WHERE report_id = ? AND report_type = 'found'"
);
$stmt->execute([$reportId]);
$item = $stmt->fetch();

if (!$item) {
    sendJson(['error' => 'Item not found'], 404);
}

sendJson(['item' => $item]);