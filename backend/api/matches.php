<?php
require_once __DIR__ . '/../helpers/cors.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/jwt.php';
require_once __DIR__ . '/../helpers/verification.php';
require_once __DIR__ . '/../config/database.php';

$auth = requireAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendJson(['error' => 'Method not allowed'], 405);
}

$pdo = getConnection();

// hidden_details is not in this query, so it can never be sent out
$stmt = $pdo->prepare(
    'SELECT m.match_id, m.similarity_score, m.status, m.verification_attempts,
            m.created_at,
            lr.user_id AS lost_user_id,
            lr.category AS lost_category, lr.brand AS lost_brand,
            lr.colour AS lost_colour, lr.description AS lost_description,
            lr.photo_url AS lost_photo_url,
            lr.latitude AS lost_latitude, lr.longitude AS lost_longitude,
            fr.user_id AS found_user_id,
            fr.category AS found_category, fr.brand AS found_brand,
            fr.colour AS found_colour, fr.description AS found_description,
            fr.photo_url AS found_photo_url,
            fr.latitude AS found_latitude, fr.longitude AS found_longitude
     FROM matches m
     JOIN item_reports lr ON lr.report_id = m.lost_report_id
     JOIN item_reports fr ON fr.report_id = m.found_report_id
     WHERE lr.user_id = ? OR fr.user_id = ?
     ORDER BY m.created_at DESC, m.match_id DESC'
);
$stmt->execute([$auth['user_id'], $auth['user_id']]);

$matches = [];
foreach ($stmt->fetchAll() as $row) {
    $isOwner = (int) $row['lost_user_id'] === $auth['user_id'];

    // Each person sees the report that belongs to the other side
    $side = $isOwner ? 'found_' : 'lost_';

    $matches[] = [
        'match_id'         => (int) $row['match_id'],
        'my_role'          => $isOwner ? 'owner' : 'finder',
        'similarity_score' => (float) $row['similarity_score'],
        'status'           => $row['status'],
        'attempts_left'    => max(0, MAX_VERIFICATION_ATTEMPTS - (int) $row['verification_attempts']),
        'created_at'       => $row['created_at'],
        'other_report'     => [
            'category'    => $row[$side . 'category'],
            'brand'       => $row[$side . 'brand'],
            'colour'      => $row[$side . 'colour'],
            'description' => $row[$side . 'description'],
            'photo_url'   => $row[$side . 'photo_url'],
            'latitude'    => (float) $row[$side . 'latitude'],
            'longitude'   => (float) $row[$side . 'longitude'],
        ],
    ];
}

sendJson(['matches' => $matches]);