<?php
require_once __DIR__ . '/../helpers/cors.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/jwt.php';
require_once __DIR__ . '/../config/database.php';

$auth = requireAuth();
$userId = $auth['user_id'];
$pdo = getConnection();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $pdo->prepare(
        'SELECT notification_id, match_id, type, message, is_read, created_at
         FROM notifications
         WHERE user_id = ?
         ORDER BY created_at DESC, notification_id DESC
         LIMIT 50'
    );
    $stmt->execute([$userId]);
    $rows = $stmt->fetchAll();

    $notifications = [];
    $unread = 0;
    foreach ($rows as $r) {
        $isRead = ((int) $r['is_read'] === 1);
        if (!$isRead) {
            $unread++;
        }
        $notifications[] = [
            'notification_id' => (int) $r['notification_id'],
            'match_id' => $r['match_id'] === null ? null : (int) $r['match_id'],
            'type' => $r['type'],
            'message' => $r['message'],
            'is_read' => $isRead,
            'created_at' => $r['created_at'],
        ];
    }

    // Count all unread, not only the 50 shown
    $stmt = $pdo->prepare('SELECT COUNT(*) AS total FROM notifications WHERE user_id = ? AND is_read = 0');
    $stmt->execute([$userId]);
    $unread = (int) $stmt->fetch()['total'];

    sendJson(['notifications' => $notifications, 'unread_count' => $unread]);
}

if ($method === 'POST') {
    $input = getJsonInput();
    $notificationId = isset($input['notification_id']) ? (int) $input['notification_id'] : 0;

    if ($notificationId > 0) {
        $stmt = $pdo->prepare('UPDATE notifications SET is_read = 1 WHERE notification_id = ? AND user_id = ?');
        $stmt->execute([$notificationId, $userId]);
    } else {
        $stmt = $pdo->prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?');
        $stmt->execute([$userId]);
    }

    sendJson(['message' => 'Notifications updated']);
}

sendJson(['error' => 'Method not allowed'], 405);