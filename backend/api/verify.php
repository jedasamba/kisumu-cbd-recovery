<?php
require_once __DIR__ . '/../helpers/cors.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/jwt.php';
require_once __DIR__ . '/../helpers/verification.php';
require_once __DIR__ . '/../config/database.php';

$auth = requireAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJson(['error' => 'Method not allowed'], 405);
}

$input   = getJsonInput();
$matchId = (int) ($input['match_id'] ?? 0);
$answer  = trim((string) ($input['answer'] ?? ''));

if ($matchId <= 0) {
    sendJson(['error' => 'A valid match_id is required'], 400);
}
if ($answer === '') {
    sendJson(['error' => 'Please enter your answer'], 400);
}
if (strlen($answer) > 255) {
    sendJson(['error' => 'Answer must be 255 characters or less'], 400);
}

$pdo = getConnection();

// Undo any open changes, then send the error reply
function failWith($pdo, $data, $status) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    sendJson($data, $status);
}

$pdo->beginTransaction();

// FOR UPDATE locks this match, so two quick requests cannot skip the attempt count
$stmt = $pdo->prepare(
    'SELECT m.match_id, m.status, m.verification_attempts,
            lr.report_id AS lost_report_id, lr.user_id AS lost_user_id,
            lr.category AS lost_category,
            fr.report_id AS found_report_id, fr.user_id AS found_user_id,
            fr.category AS found_category, fr.hidden_details
     FROM matches m
     JOIN item_reports lr ON lr.report_id = m.lost_report_id
     JOIN item_reports fr ON fr.report_id = m.found_report_id
     WHERE m.match_id = ?
     FOR UPDATE'
);
$stmt->execute([$matchId]);
$match = $stmt->fetch();

if (!$match) {
    failWith($pdo, ['error' => 'Match not found'], 404);
}
if ((int) $match['lost_user_id'] !== $auth['user_id']) {
    failWith($pdo, ['error' => 'Only the owner of the lost report can claim this item'], 403);
}
if ($match['status'] === 'Verified') {
    failWith($pdo, ['error' => 'This match is already verified'], 409);
}
if ($match['status'] === 'Flagged') {
    failWith($pdo, ['error' => 'This claim has been flagged and is waiting for an administrator'], 403);
}
if (trim((string) $match['hidden_details']) === '') {
    failWith($pdo, ['error' => 'This found item has no private detail to check'], 409);
}

$attempts = (int) $match['verification_attempts'] + 1;

$setReports = $pdo->prepare('UPDATE item_reports SET status = ? WHERE report_id IN (?, ?)');
$setMatch = $pdo->prepare('UPDATE matches SET status = ?, verification_attempts = ? WHERE match_id = ?');
$notify = $pdo->prepare(
    'INSERT INTO notifications (user_id, match_id, type, message) VALUES (?, ?, ?, ?)'
);

// The first attempt moves both reports to Verification Pending
if ($attempts === 1) {
    $setReports->execute(['Verification Pending', $match['lost_report_id'], $match['found_report_id']]);
}

// Correct answer: the match and both reports become Verified
if (answerIsCorrect($match['hidden_details'], $answer)) {
    $setMatch->execute(['Verified', $attempts, $matchId]);
    $setReports->execute(['Verified', $match['lost_report_id'], $match['found_report_id']]);

    $notify->execute([
        $match['found_user_id'], $matchId, 'verified',
        'The owner of your found ' . $match['found_category'] . ' passed verification. You can now message them.',
    ]);
    $notify->execute([
        $match['lost_user_id'], $matchId, 'verified',
        'Ownership of your lost ' . $match['lost_category'] . ' is verified. You can now message the finder.',
    ]);

    $pdo->commit();
    sendJson([
        'verified' => true,
        'message'  => 'Ownership verified. You can now message the finder.',
        'match_id' => $matchId,
    ]);
}

// Wrong answer, third time: flag the claim and alert every administrator
if ($attempts >= MAX_VERIFICATION_ATTEMPTS) {
    $setMatch->execute(['Flagged', $attempts, $matchId]);

    $admins = $pdo->query("SELECT user_id FROM users WHERE role = 'admin'")->fetchAll();
    foreach ($admins as $admin) {
        $notify->execute([
            $admin['user_id'], $matchId, 'flagged_claim',
            'Match #' . $matchId . ' was flagged after 3 wrong verification answers. Please review it.',
        ]);
    }
    $notify->execute([
        $match['lost_user_id'], $matchId, 'flagged',
        'Your claim on a found ' . $match['found_category'] . ' was flagged after 3 wrong answers. An administrator will review it.',
    ]);

    $pdo->commit();
    sendJson([
        'verified'      => false,
        'flagged'       => true,
        'attempts_left' => 0,
        'error'         => 'Too many wrong answers. The claim has been flagged and an administrator has been told.',
    ], 403);
}

// Wrong answer, attempts left
$setMatch->execute([$match['status'], $attempts, $matchId]);
$pdo->commit();

sendJson([
    'verified'      => false,
    'flagged'       => false,
    'attempts_left' => MAX_VERIFICATION_ATTEMPTS - $attempts,
    'error'         => 'That answer does not match the private detail. Please try again.',
], 400);