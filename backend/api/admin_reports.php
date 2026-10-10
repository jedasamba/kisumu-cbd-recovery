<?php
require_once __DIR__ . '/../helpers/cors.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/jwt.php';
require_once __DIR__ . '/../config/database.php';

requireAdmin();
$pdo = getConnection();

// GET: every report from every user, with the reporter's name
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $pdo->query(
        'SELECT r.report_id, r.report_type, r.category, r.brand, r.colour,
                r.description, r.photo_url, r.latitude, r.longitude,
                r.status, r.created_at, u.full_name AS reporter_name
         FROM item_reports r
         JOIN users u ON u.user_id = r.user_id
         ORDER BY r.created_at DESC'
    );
    $reports = $stmt->fetchAll();

    foreach ($reports as &$report) {
        $report['latitude']  = (float) $report['latitude'];
        $report['longitude'] = (float) $report['longitude'];
    }
    unset($report);

    sendJson(['reports' => $reports]);
}

// POST: moderation, close a report (for example spam or a duplicate)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = getJsonInput();
    $reportId = (int) ($input['report_id'] ?? 0);

    if ($reportId <= 0) {
        sendJson(['error' => 'A valid report_id is required'], 400);
    }

    $check = $pdo->prepare('SELECT report_id FROM item_reports WHERE report_id = ?');
    $check->execute([$reportId]);
    if (!$check->fetch()) {
        sendJson(['error' => 'Report not found'], 404);
    }

    $update = $pdo->prepare("UPDATE item_reports SET status = 'Closed' WHERE report_id = ?");
    $update->execute([$reportId]);

    sendJson(['message' => 'Report closed', 'report_id' => $reportId]);
}

sendJson(['error' => 'Method not allowed'], 405);