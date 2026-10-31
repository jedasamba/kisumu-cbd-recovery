<?php
require_once __DIR__ . '/../helpers/cors.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/jwt.php';
require_once __DIR__ . '/../config/database.php';

requireAdmin();
$pdo = getConnection();

$method = $_SERVER['REQUEST_METHOD'];

// GET: flagged claims waiting for an admin decision
if ($method === 'GET') {
    $stmt = $pdo->query(
        "SELECT m.match_id, m.similarity_score, m.created_at,
                lr.category AS lost_category, lr.brand AS lost_brand,
                lr.colour AS lost_colour, lr.description AS lost_description,
                fr.category AS found_category, fr.brand AS found_brand,
                fr.colour AS found_colour, fr.description AS found_description,
                fr.photo_url AS found_photo,
                ou.full_name AS owner_name, ou.phone AS owner_phone,
                fu.full_name AS finder_name, fu.phone AS finder_phone
         FROM matches m
         JOIN item_reports lr ON lr.report_id = m.lost_report_id
         JOIN item_reports fr ON fr.report_id = m.found_report_id
         JOIN users ou ON ou.user_id = lr.user_id
         JOIN users fu ON fu.user_id = fr.user_id
         WHERE m.status = 'Flagged' AND m.reviewed = 0
         ORDER BY m.created_at DESC"
    );
    sendJson(['claims' => $stmt->fetchAll()]);
}

if ($method !== 'POST') {
    sendJson(['error' => 'Method not allowed'], 405);
}

// POST: the admin decides what happens to a flagged claim
$input = getJsonInput();
$matchId = isset($input['match_id']) ? (int) $input['match_id'] : 0;
$action = isset($input['action']) ? $input['action'] : '';

if ($matchId <= 0) {
    sendJson(['error' => 'A valid match is required'], 400);
}
if ($action !== 'reset' && $action !== 'reject') {
    sendJson(['error' => 'Action must be reset or reject'], 400);
}

$stmt = $pdo->prepare(
    'SELECT m.match_id, m.status, m.reviewed,
            lr.report_id AS lost_id, lr.user_id AS owner_id,
            fr.report_id AS found_id
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
if ($match['status'] !== 'Flagged' || (int) $match['reviewed'] === 1) {
    sendJson(['error' => 'This claim is not waiting for review'], 409);
}

try {
    $pdo->beginTransaction();

    if ($action === 'reset') {
        $stmt = $pdo->prepare(
            "UPDATE matches SET status = 'Pending', verification_attempts = 0, reviewed = 0
             WHERE match_id = ?"
        );
        $stmt->execute([$matchId]);

        $stmt = $pdo->prepare("UPDATE item_reports SET status = 'Match Found' WHERE report_id IN (?, ?)");
        $stmt->execute([$match['lost_id'], $match['found_id']]);

        $type = 'claim_reset';
        $text = 'An administrator reviewed your claim. You have 3 new attempts to verify ownership.';
    } else {
        $stmt = $pdo->prepare('UPDATE matches SET reviewed = 1 WHERE match_id = ?');
        $stmt->execute([$matchId]);

        $stmt = $pdo->prepare("UPDATE item_reports SET status = 'Reported' WHERE report_id IN (?, ?)");
        $stmt->execute([$match['lost_id'], $match['found_id']]);

        $type = 'claim_rejected';
        $text = 'An administrator reviewed your claim and could not confirm ownership. Contact the administrator if you think this is a mistake.';
    }

    $stmt = $pdo->prepare(
        'INSERT INTO notifications (user_id, match_id, type, message) VALUES (?, ?, ?, ?)'
    );
    $stmt->execute([$match['owner_id'], $matchId, $type, $text]);

    $pdo->commit();
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    sendJson(['error' => 'Could not save. Please try again.'], 500);
}

sendJson(['message' => $action === 'reset' ? 'The owner has 3 new attempts.' : 'The claim was rejected.']);