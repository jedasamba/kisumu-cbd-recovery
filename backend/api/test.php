<?php
require_once __DIR__ . '/../helpers/cors.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../config/database.php';

$pdo = getConnection();
$row = $pdo->query('SELECT COUNT(*) AS total FROM users')->fetch();

sendJson([
    'message'     => 'API is working',
    'database'    => 'connected',
    'users_count' => (int) $row['total'],
]);