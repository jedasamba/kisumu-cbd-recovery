<?php
require_once __DIR__ . '/../helpers/cors.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../config/database.php';

// Only POST requests are allowed
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJson(['error' => 'Method not allowed'], 405);
}

$input = getJsonInput();

$fullName = trim($input['full_name'] ?? '');
$email    = strtolower(trim($input['email'] ?? ''));
$password = $input['password'] ?? '';
$phone    = trim($input['phone'] ?? '');

// Validation
if ($fullName === '' || $email === '' || $password === '') {
    sendJson(['error' => 'Full name, email and password are required'], 400);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    sendJson(['error' => 'Please enter a valid email address'], 400);
}
if (strlen($password) < 8) {
    sendJson(['error' => 'Password must be at least 8 characters'], 400);
}

$pdo = getConnection();

// Check for a duplicate email
$check = $pdo->prepare('SELECT user_id FROM users WHERE email = ?');
$check->execute([$email]);
if ($check->fetch()) {
    sendJson(['error' => 'An account with this email already exists'], 409);
}

// Hash the password with bcrypt and save the user
$hash = password_hash($password, PASSWORD_BCRYPT);

$insert = $pdo->prepare(
    'INSERT INTO users (full_name, email, password_hash, phone, role)
     VALUES (?, ?, ?, ?, ?)'
);
$insert->execute([
    $fullName,
    $email,
    $hash,
    $phone === '' ? null : $phone,
    'resident',
]);

sendJson([
    'message' => 'Registration successful',
    'user_id' => (int) $pdo->lastInsertId(),
], 201);