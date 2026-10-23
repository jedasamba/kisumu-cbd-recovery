<?php
require_once __DIR__ . '/../helpers/cors.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/jwt.php';
require_once __DIR__ . '/../config/database.php';

$auth = requireAuth();
$userId = $auth['user_id'];
$pdo = getConnection();

$method = $_SERVER['REQUEST_METHOD'];
if ($method !== 'GET' && $method !== 'POST') {
    sendJson(['error' => 'Method not allowed'], 405);
}

if ($method === 'GET') {
    $matchId = isset($_GET['match_id']) ? (int) $_GET['match_id'] : 0;
} else {
    $input = getJsonInput();
    $matchId = isset($input['match_id']) ? (int) $input['match_id'] : 0;
}

if ($matchId <= 0) {
    sendJson(['error' => 'A valid match is required'], 400);
}

// Load the match and the two people in it
$stmt = $pdo->prepare(
    'SELECT m.match_id, m.status, lr.user_id AS owner_id, fr.user_id AS finder_id
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

if ($userId != $match['owner_id'] && $userId != $match['finder_id']) {
    sendJson(['error' => 'You are not part of this match'], 403);
}

if ($match['status'] !== 'Verified') {
    sendJson(['error' => 'Messaging opens after ownership is verified'], 403);
}

$otherId = ($userId == $match['owner_id']) ? $match['finder_id'] : $match['owner_id'];

if ($method === 'GET') {
    $stmt = $pdo->prepare(
        'SELECT ms.message_id, ms.sender_id, u.full_name AS sender_name,
                ms.message_text, ms.sent_at
         FROM messages ms
         JOIN users u ON u.user_id = ms.sender_id
         WHERE ms.match_id = ?
         ORDER BY ms.sent_at ASC, ms.message_id ASC'
    );
    $stmt->execute([$matchId]);
    $rows = $stmt->fetchAll();

    $messages = [];
    foreach ($rows as $r) {
        $messages[] = [
            'message_id' => (int) $r['message_id'],
            'sender_name' => $r['sender_name'],
            'message_text' => $r['message_text'],
            'sent_at' => $r['sent_at'],
            'mine' => ((int) $r['sender_id'] === (int) $userId),
        ];
    }
    sendJson(['messages' => $messages]);
}

// POST: send a message
$text = isset($input['message_text']) ? trim($input['message_text']) : '';
if ($text === '') {
    sendJson(['error' => 'Message cannot be empty'], 400);
}
if (mb_strlen($text) > 500) {
    sendJson(['error' => 'Message is too long (500 characters maximum)'], 400);
}

$stmt = $pdo->prepare(
    'INSERT INTO messages (match_id, sender_id, message_text) VALUES (?, ?, ?)'
);
$stmt->execute([$matchId, $userId, $text]);

$stmt = $pdo->prepare(
    'INSERT INTO notifications (user_id, match_id, type, message) VALUES (?, ?, ?, ?)'
);
$stmt->execute([$otherId, $matchId, 'message', 'You have a new message about your match.']);

sendJson(['message' => 'Message sent'], 201);