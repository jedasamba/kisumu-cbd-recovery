<?php
require_once __DIR__ . '/../helpers/cors.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendJson(['error' => 'Method not allowed'], 405);
}

$pdo = getConnection();

// Only counts are returned. No names, locations or item details.
$counts = ['lost' => 0, 'found' => 0];
$rows = $pdo->query('SELECT report_type, COUNT(*) AS total FROM item_reports GROUP BY report_type')->fetchAll();
foreach ($rows as $row) {
    $counts[$row['report_type']] = (int) $row['total'];
}

$matches = (int) $pdo->query('SELECT COUNT(*) FROM matches')->fetchColumn();
$verified = (int) $pdo->query("SELECT COUNT(*) FROM matches WHERE status = 'Verified'")->fetchColumn();
$recovered = (int) $pdo->query("SELECT COUNT(*) FROM item_reports WHERE report_type = 'lost' AND status = 'Recovered'")->fetchColumn();

$rate = $counts['lost'] > 0 ? round(($recovered / $counts['lost']) * 100, 1) : 0;

$categories = [];
$rows = $pdo->query(
    "SELECT category, COUNT(*) AS total
     FROM item_reports
     WHERE report_type = 'lost'
     GROUP BY category
     ORDER BY total DESC"
)->fetchAll();
foreach ($rows as $row) {
    $categories[] = ['category' => $row['category'], 'total' => (int) $row['total']];
}

sendJson([
    'total_reports' => $counts['lost'] + $counts['found'],
    'lost_reports' => $counts['lost'],
    'found_reports' => $counts['found'],
    'total_matches' => $matches,
    'ownership_verified' => $verified,
    'items_recovered' => $recovered,
    'recovery_rate' => $rate,
    'lost_by_category' => $categories,
]);