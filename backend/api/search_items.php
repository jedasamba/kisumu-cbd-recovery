<?php
require_once __DIR__ . '/../helpers/cors.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/jwt.php';
require_once __DIR__ . '/../config/database.php';

requireAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendJson(['error' => 'Method not allowed'], 405);
}

$allowedCategories = [
    'Phone', 'Wallet', 'ID Card', 'Keys', 'Bag',
    'Electronics', 'Documents', 'Other',
];

$category = isset($_GET['category']) ? trim($_GET['category']) : '';
$colour = isset($_GET['colour']) ? trim($_GET['colour']) : '';
$keyword = isset($_GET['q']) ? trim($_GET['q']) : '';

if ($category !== '' && !in_array($category, $allowedCategories, true)) {
    sendJson(['error' => 'Please choose a valid category'], 400);
}

$pdo = getConnection();

// Only found items that are still open. The private detail and the finder are never selected.
$sql = "SELECT report_id, category, brand, colour, description, photo_url, status, created_at
        FROM item_reports
        WHERE report_type = 'found' AND status IN ('Reported', 'Match Found')";
$params = [];

if ($category !== '') {
    $sql .= ' AND category = ?';
    $params[] = $category;
}
if ($colour !== '') {
    $sql .= ' AND colour LIKE ?';
    $params[] = '%' . $colour . '%';
}
if ($keyword !== '') {
    $sql .= ' AND (brand LIKE ? OR description LIKE ?)';
    $params[] = '%' . $keyword . '%';
    $params[] = '%' . $keyword . '%';
}

$sql .= ' ORDER BY created_at DESC LIMIT 50';

$stmt = $pdo->prepare($sql);
$stmt->execute($params);

sendJson(['items' => $stmt->fetchAll()]);