<?php
// Similarity matching algorithm (SDS section 3.2.3, Process 3.0)

const MATCH_THRESHOLD = 60;

// Distance in metres between two GPS points (Haversine formula)
function haversineMeters($lat1, $lon1, $lat2, $lon2) {
    $earthRadius = 6371000;
    $dLat = deg2rad($lat2 - $lat1);
    $dLon = deg2rad($lon2 - $lon1);

    $a = sin($dLat / 2) ** 2
       + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLon / 2) ** 2;

    return $earthRadius * 2 * atan2(sqrt($a), sqrt(1 - $a));
}

// Closer reports score higher, from 25 points down to 5
function distanceScore($meters) {
    if ($meters <= 100)  return 25;
    if ($meters <= 250)  return 20;
    if ($meters <= 500)  return 15;
    if ($meters <= 1000) return 10;
    return 5;
}

// True only when both values are filled in and equal (ignoring case)
function sameText($first, $second) {
    $first  = strtolower(trim((string) $first));
    $second = strtolower(trim((string) $second));
    return $first !== '' && $first === $second;
}

// Weighted similarity score between two reports
function calculateScore($first, $second) {
    $score = 0;

    if ($first['category'] === $second['category']) {
        $score += 40;
    }
    if (sameText($first['brand'], $second['brand'])) {
        $score += 20;
    }
    if (sameText($first['colour'], $second['colour'])) {
        $score += 15;
    }

    $meters = haversineMeters(
        (float) $first['latitude'], (float) $first['longitude'],
        (float) $second['latitude'], (float) $second['longitude']
    );
    $score += distanceScore($meters);

    return $score;
}

// Compare a new report with open reports of the opposite type.
// Returns how many matches were created.
function runMatching($pdo, $reportId) {
    $stmt = $pdo->prepare(
        'SELECT report_id, user_id, report_type, category, brand, colour,
                latitude, longitude
         FROM item_reports WHERE report_id = ?'
    );
    $stmt->execute([$reportId]);
    $newReport = $stmt->fetch();

    if (!$newReport) {
        return 0;
    }

    // A lost report is compared with found reports, and the other way round.
    // Only open reports (status Reported) from other users are candidates.
    $oppositeType = $newReport['report_type'] === 'lost' ? 'found' : 'lost';

    $candidateQuery = $pdo->prepare(
        "SELECT report_id, user_id, report_type, category, brand, colour,
                latitude, longitude
         FROM item_reports
         WHERE report_type = ? AND status = 'Reported' AND user_id <> ?"
    );
    $candidateQuery->execute([$oppositeType, $newReport['user_id']]);
    $candidates = $candidateQuery->fetchAll();

    $insertMatch = $pdo->prepare(
        'INSERT INTO matches (lost_report_id, found_report_id, similarity_score)
         VALUES (?, ?, ?)'
    );
    $updateStatus = $pdo->prepare(
        "UPDATE item_reports SET status = 'Match Found' WHERE report_id = ?"
    );
    $insertNote = $pdo->prepare(
        'INSERT INTO notifications (user_id, match_id, type, message)
         VALUES (?, ?, ?, ?)'
    );

    $matchesCreated = 0;

    $pdo->beginTransaction();
    try {
        foreach ($candidates as $candidate) {
            $score = calculateScore($newReport, $candidate);

            if ($score < MATCH_THRESHOLD) {
                continue;
            }

            $lost  = $newReport['report_type'] === 'lost' ? $newReport : $candidate;
            $found = $newReport['report_type'] === 'found' ? $newReport : $candidate;

            $insertMatch->execute([$lost['report_id'], $found['report_id'], $score]);
            $matchId = (int) $pdo->lastInsertId();

            $updateStatus->execute([$lost['report_id']]);
            $updateStatus->execute([$found['report_id']]);

            $insertNote->execute([
                $lost['user_id'], $matchId, 'match',
                'A possible match was found for your lost ' . $lost['category'] . ' report.',
            ]);
            $insertNote->execute([
                $found['user_id'], $matchId, 'match',
                'Your found ' . $found['category'] . ' report may match a lost item report.',
            ]);

            $matchesCreated++;
        }
        $pdo->commit();
    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }

    return $matchesCreated;
}