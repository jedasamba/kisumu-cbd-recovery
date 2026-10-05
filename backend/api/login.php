<?php
require_once __DIR__ . '/../helpers/cors.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/jwt.php';
require_once __DIR__ . '/../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJson(['error' => 'Method not allowed'], 405);
}

$input = getJsonInput();

$email    = strtolower(trim($input['email'] ?? ''));
$password = $input['password'] ?? '';

if ($email === '' || $password === '') {
    sendJson(['error' => 'Email and password are required'], 400);
}

$pdo = getConnection();

$stmt = $pdo->prepare(
    'SELECT user_id, full_name, email, password_hash, role
     FROM users WHERE email = ?'
);
$stmt->execute([$email]);
$user = $stmt->fetch();

// Same message for "no such email" and "wrong password" on purpose,
// so attackers cannot tell which emails are registered.
if (!$user || !password_verify($password, $user['password_hash'])) {
    sendJson(['error' => 'Invalid email or password'], 401);
}

sendJson([
    'message' => 'Login successful',
    'token'   => createToken($user),
    'user'    => [
        'user_id'   => (int) $user['user_id'],
        'full_name' => $user['full_name'],
        'email'     => $user['email'],
        'role'      => $user['role'],
    ],
]);