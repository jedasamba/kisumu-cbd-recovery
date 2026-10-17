<?php
// Ownership verification helpers (SDS Process 4.0)

const MAX_VERIFICATION_ATTEMPTS = 3;

// Plain words that carry no meaning for the comparison
function stopWords() {
    return ['the', 'and', 'has', 'have', 'with', 'for', 'are', 'was',
            'that', 'this', 'its', 'our', 'his', 'her'];
}

// Lowercase the text and keep only the important words
function importantWords($text) {
    $words = preg_split('/[^\p{L}\p{N}]+/u', strtolower($text), -1, PREG_SPLIT_NO_EMPTY);
    if ($words === false) {
        return [];
    }

    $stop = stopWords();
    $result = [];
    foreach ($words as $word) {
        if (strlen($word) >= 3 && !in_array($word, $stop, true)) {
            $result[] = $word;
        }
    }
    return array_values(array_unique($result));
}

// The answer is accepted when at least 60% of the important words
// in the hidden detail appear in the claimant's answer.
function answerIsCorrect($hiddenDetail, $answer) {
    $expected = importantWords($hiddenDetail);
    if (count($expected) === 0) {
        return false;
    }

    $given = importantWords($answer);
    $found = count(array_intersect($expected, $given));
    $needed = ceil(count($expected) * 3 / 5);

    return $found >= $needed;
}