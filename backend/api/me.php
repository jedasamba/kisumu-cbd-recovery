<?php
require_once __DIR__ . '/../helpers/cors.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/jwt.php';
require_once __DIR__ . '/../config/database.php';

$auth = requireAuth();

$pdo = getConnection();
$stmt = $pdo->prepare(
    'SELECT user_id, full_name, email, phone, role, created_at
     FROM users WHERE user_id = ?'
);
$stmt->execute([$auth['user_id']]);
$user = $stmt->fetch();

if (!$user) {
    sendJson(['error' => 'User not found'], 404);
}

sendJson(['user' => $user]);