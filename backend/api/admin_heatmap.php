<?php
require_once __DIR__ . '/../helpers/cors.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/jwt.php';
require_once __DIR__ . '/../config/database.php';

requireAdmin();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendJson(['error' => 'Method not allowed'], 405);
}

$type = isset($_GET['type']) ? $_GET['type'] : 'lost';
if (!in_array($type, ['lost', 'found', 'all'], true)) {
    sendJson(['error' => 'Type must be lost, found or all'], 400);
}

$pdo = getConnection();

// Coordinates only: no names, descriptions or private details
if ($type === 'all') {
    $stmt = $pdo->query('SELECT latitude, longitude FROM item_reports');
} else {
    $stmt = $pdo->prepare('SELECT latitude, longitude FROM item_reports WHERE report_type = ?');
    $stmt->execute([$type]);
}
$rows = $stmt->fetchAll();

$points = [];
foreach ($rows as $r) {
    $points[] = [(float) $r['latitude'], (float) $r['longitude']];
}

sendJson(['points' => $points, 'total' => count($points)]);