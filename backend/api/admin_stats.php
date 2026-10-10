<?php
require_once __DIR__ . '/../helpers/cors.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/jwt.php';
require_once __DIR__ . '/../config/database.php';

// Only logged-in admins get past this line
requireAdmin();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendJson(['error' => 'Method not allowed'], 405);
}

$pdo = getConnection();

$totalReports = (int) $pdo->query('SELECT COUNT(*) FROM item_reports')->fetchColumn();
$totalMatches = (int) $pdo->query('SELECT COUNT(*) FROM matches')->fetchColumn();
$totalLost = (int) $pdo->query(
    "SELECT COUNT(*) FROM item_reports WHERE report_type = 'lost'"
)->fetchColumn();
$recovered = (int) $pdo->query(
    "SELECT COUNT(*) FROM item_reports
     WHERE report_type = 'lost' AND status = 'Recovered'"
)->fetchColumn();

// Recovery rate = lost items recovered as a percentage of all lost reports
$rate = $totalLost > 0 ? round(($recovered / $totalLost) * 100, 1) : 0;

sendJson([
    'total_reports'  => $totalReports,
    'total_matches'  => $totalMatches,
    'items_recovered' => $recovered,
    'recovery_rate'  => $rate,
]);