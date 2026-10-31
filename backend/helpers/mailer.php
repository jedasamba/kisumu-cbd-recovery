<?php
require_once __DIR__ . '/../vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;

// Sends an email for every notification that has not been emailed yet.
// It never stops the main request if the email fails.
function sendPendingEmails()
{
    try {
        if (!function_exists('getConnection')) {
            return;
        }
        $config = require __DIR__ . '/../config/config.php';
        if (empty($config['mail_host'])) {
            return;
        }

        $pdo = getConnection();
        $rows = $pdo->query(
            'SELECT n.notification_id, n.message, u.email, u.full_name
             FROM notifications n
             JOIN users u ON u.user_id = n.user_id
             WHERE n.emailed = 0
             LIMIT 20'
        )->fetchAll();

        foreach ($rows as $row) {
            try {
                $mail = new PHPMailer(true);
                $mail->isSMTP();
                $mail->Host = $config['mail_host'];
                $mail->SMTPAuth = true;
                $mail->Username = $config['mail_user'];
                $mail->Password = $config['mail_pass'];
                $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
                $mail->Port = $config['mail_port'];
                $mail->Timeout = 10;

                $mail->setFrom($config['mail_from'], 'Kisumu CBD Recovery');
                $mail->addAddress($row['email'], $row['full_name']);
                $mail->Subject = 'Kisumu CBD Recovery update';
                $mail->Body = 'Hello ' . $row['full_name'] . ",\n\n"
                    . $row['message'] . "\n\n"
                    . 'Log in to see the details: '
                    . rtrim($config['allowed_origin'], '/') . "/notifications\n\n"
                    . 'Kisumu CBD Item Recovery and Tracking System';
                $mail->send();
            } catch (Throwable $e) {
                error_log('Email failed: ' . $e->getMessage());
            }

            // Mark as handled so a failing email is not retried on every request
            $mark = $pdo->prepare('UPDATE notifications SET emailed = 1 WHERE notification_id = ?');
            $mark->execute([$row['notification_id']]);
        }
    } catch (Throwable $e) {
        error_log('Email system error: ' . $e->getMessage());
    }
}