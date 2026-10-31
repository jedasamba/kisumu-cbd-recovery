<?php
require_once __DIR__ . '/../helpers/cors.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/jwt.php';
require_once __DIR__ . '/../config/database.php';

$auth = requireAuth();
$userId = $auth['user_id'];
$pdo = getConnection();

$method = $_SERVER['REQUEST_METHOD'];

// GET: which of my matches have already been recovered
if ($method === 'GET') {
    $stmt = $pdo->prepare(
        "SELECT m.match_id
         FROM matches m
         JOIN item_reports lr ON lr.report_id = m.lost_report_id
         JOIN item_reports fr ON fr.report_id = m.found_report_id
         WHERE lr.status = 'Recovered' AND (lr.user_id = ? OR fr.user_id = ?)"
    );
    $stmt->execute([$userId, $userId]);
    $ids = [];
    foreach ($stmt->fetchAll() as $row) {
        $ids[] = (int) $row['match_id'];
    }
    sendJson(['recovered_match_ids' => $ids]);
}

if ($method !== 'POST') {
    sendJson(['error' => 'Method not allowed'], 405);
}

// POST: the owner confirms they got the item back
$input = getJsonInput();
$matchId = isset($input['match_id']) ? (int) $input['match_id'] : 0;
if ($matchId <= 0) {
    sendJson(['error' => 'A valid match is required'], 400);
}

$stmt = $pdo->prepare(
    'SELECT m.match_id, m.status AS match_status,
            lr.report_id AS lost_id, lr.user_id AS owner_id, lr.status AS lost_status,
            fr.report_id AS found_id, fr.user_id AS finder_id
     FROM matches m
     JOIN item_reports lr ON lr.report_id = m.lost_report_id
     JOIN item_reports fr ON fr.report_id = m.found_report_id
     WHERE m.match_id = ?'
);
$stmt->execute([$matchId]);
$match = $stmt->fetch();

if (!$match) {
    sendJson(['error' => 'Match not found'], 404);
}
if ((int) $match['owner_id'] !== (int) $userId) {
    sendJson(['error' => 'Only the owner of the lost item can confirm recovery'], 403);
}
if ($match['match_status'] !== 'Verified') {
    sendJson(['error' => 'Ownership must be verified first'], 409);
}
if ($match['lost_status'] === 'Recovered') {
    sendJson(['error' => 'This item is already marked as recovered'], 409);
}

try {
    $pdo->beginTransaction();

    $stmt = $pdo->prepare("UPDATE item_reports SET status = 'Recovered' WHERE report_id IN (?, ?)");
    $stmt->execute([$match['lost_id'], $match['found_id']]);

    $stmt = $pdo->prepare(
        'INSERT INTO notifications (user_id, match_id, type, message) VALUES (?, ?, ?, ?)'
    );
    $stmt->execute([
        $match['finder_id'],
        $matchId,
        'recovered',
        'The owner confirmed they got their item back. Thank you for helping!',
    ]);

    $pdo->commit();
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    sendJson(['error' => 'Could not save. Please try again.'], 500);
}

sendJson(['message' => 'Item marked as recovered. Thank you!']);