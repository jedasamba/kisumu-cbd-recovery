<?php
$config = require __DIR__ . '/../config/config.php';

header('Access-Control-Allow-Origin: ' . $config['allowed_origin']);
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Content-Type: application/json; charset=UTF-8');

// Browsers send an OPTIONS "preflight" request first. Answer it and stop.
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}