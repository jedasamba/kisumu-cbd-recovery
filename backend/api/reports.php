<?php
require_once __DIR__ . '/../helpers/cors.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/jwt.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/matching.php';

// Every request to this file needs a valid token
$auth = requireAuth();
$pdo = getConnection();

// GET: list the logged-in user's own reports (hidden_details is never selected)
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $pdo->prepare(
        'SELECT report_id, report_type, category, brand, colour, description,
                photo_url, latitude, longitude, status, created_at
         FROM item_reports
         WHERE user_id = ?
         ORDER BY created_at DESC'
    );
    $stmt->execute([$auth['user_id']]);
    $reports = $stmt->fetchAll();

    foreach ($reports as &$report) {
        $report['latitude']  = (float) $report['latitude'];
        $report['longitude'] = (float) $report['longitude'];
    }
    unset($report);

    sendJson(['reports' => $reports]);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJson(['error' => 'Method not allowed'], 405);
}

// POST: submit a new lost or found report (sent as multipart form data)
$allowedCategories = [
    'Phone', 'Wallet', 'ID Card', 'Keys', 'Bag',
    'Electronics', 'Documents', 'Other',
];

$type        = $_POST['report_type'] ?? '';
$category    = trim($_POST['category'] ?? '');
$brand       = trim($_POST['brand'] ?? '');
$colour      = trim($_POST['colour'] ?? '');
$description = trim($_POST['description'] ?? '');
$latitude    = $_POST['latitude'] ?? '';
$longitude   = $_POST['longitude'] ?? '';
$hidden      = trim($_POST['hidden_details'] ?? '');

// Validate the text fields first, before touching any uploaded file
if (!in_array($type, ['lost', 'found'], true)) {
    sendJson(['error' => 'Report type must be lost or found'], 400);
}
if (!in_array($category, $allowedCategories, true)) {
    sendJson(['error' => 'Please choose a valid item category'], 400);
}
if (!is_numeric($latitude) || !is_numeric($longitude)
    || $latitude < -90 || $latitude > 90
    || $longitude < -180 || $longitude > 180) {
    sendJson(['error' => 'Please drop a pin on the map to set the location'], 400);
}
if (strlen($description) > 500) {
    sendJson(['error' => 'Description must be 500 characters or less'], 400);
}
if ($type === 'found' && $hidden === '') {
    sendJson(['error' => 'A private identifying detail is required for found items'], 400);
}

// Handle the optional photo
$photoUrl = null;
if (isset($_FILES['photo']) && $_FILES['photo']['error'] !== UPLOAD_ERR_NO_FILE) {
    $file = $_FILES['photo'];

    if ($file['error'] !== UPLOAD_ERR_OK) {
        sendJson(['error' => 'Photo upload failed. Please try again'], 400);
    }
    if ($file['size'] > 5 * 1024 * 1024) {
        sendJson(['error' => 'Photo must be 5MB or smaller'], 400);
    }

    // Check the real file type, not just the file name
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime = $finfo->file($file['tmp_name']);
    $extensions = ['image/jpeg' => 'jpg', 'image/png' => 'png'];

    if (!isset($extensions[$mime])) {
        sendJson(['error' => 'Photo must be a JPG or PNG image'], 400);
    }

    // Random file name so uploads cannot overwrite each other
    $filename = bin2hex(random_bytes(16)) . '.' . $extensions[$mime];
    $destination = __DIR__ . '/../uploads/' . $filename;

    if (!move_uploaded_file($file['tmp_name'], $destination)) {
        sendJson(['error' => 'Could not save the photo'], 500);
    }
    $photoUrl = 'uploads/' . $filename;
}

$insert = $pdo->prepare(
    'INSERT INTO item_reports
        (user_id, report_type, category, brand, colour, description,
         photo_url, latitude, longitude, hidden_details)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
);
$insert->execute([
    $auth['user_id'],
    $type,
    $category,
    $brand === '' ? null : $brand,
    $colour === '' ? null : $colour,
    $description === '' ? null : $description,
    $photoUrl,
    $latitude,
    $longitude,
    $type === 'found' ? $hidden : null,
]);

$newReportId = (int) $pdo->lastInsertId();
$matchesFound = runMatching($pdo, $newReportId);

sendJson([
    'message'       => 'Report submitted successfully',
    'report_id'     => $newReportId,
    'matches_found' => $matchesFound,
], 201);