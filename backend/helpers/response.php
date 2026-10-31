<?php
function sendJson($data, $status = 200)
{
    http_response_code($status);
    echo json_encode($data);

    // After any POST, email the notifications that were just created
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        require_once __DIR__ . '/mailer.php';
        sendPendingEmails();
    }
    exit;
}

function getJsonInput()
{
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}