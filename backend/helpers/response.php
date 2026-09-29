<?php
function sendJson($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data);
    exit;
}