<?php
require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/response.php';

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

// Create a signed token that lasts 8 hours
function createToken($user) {
    $config = require __DIR__ . '/../config/config.php';
    $now = time();

    $payload = [
        'user_id' => (int) $user['user_id'],
        'role'    => $user['role'],
        'iat'     => $now,
        'exp'     => $now + (60 * 60 * 8),
    ];

    return JWT::encode($payload, $config['jwt_secret'], 'HS256');
}

// Read the token from the "Authorization: Bearer <token>" header
function getBearerToken() {
    $header = $_SERVER['HTTP_AUTHORIZATION']
        ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION']
        ?? '';

    if ($header === '' && function_exists('getallheaders')) {
        $headers = getallheaders();
        $header = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    }

    if (preg_match('/Bearer\s+(.+)/i', $header, $matches)) {
        return trim($matches[1]);
    }
    return null;
}

// Use this at the top of any protected endpoint.
// Returns the logged-in user's id and role, or stops with 401.
function requireAuth() {
    $config = require __DIR__ . '/../config/config.php';
    $token = getBearerToken();

    if (!$token) {
        sendJson(['error' => 'Authentication required'], 401);
    }

    try {
        $decoded = JWT::decode($token, new Key($config['jwt_secret'], 'HS256'));
        return [
            'user_id' => (int) $decoded->user_id,
            'role'    => $decoded->role,
        ];
    } catch (Exception $e) {
        sendJson(['error' => 'Invalid or expired token'], 401);
    }
}

// Use this for admin-only endpoints
function requireAdmin() {
    $auth = requireAuth();
    if ($auth['role'] !== 'admin') {
        sendJson(['error' => 'Admin access required'], 403);
    }
    return $auth;
}