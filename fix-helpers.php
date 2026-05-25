<?php

$file = 'resources/js/pages/Courses/Show.tsx';
$lines = file($file);

// Fix import
foreach ($lines as &$line) {
    if (strpos($line, "from 'react';") !== false && strpos($line, "import {") !== false) {
        if (strpos($line, "memo") === false) {
            $line = str_replace("useMemo", "useMemo, memo, useCallback", $line);
        }
        break;
    }
}
unset($line);

function extractBlock(&$lines, $startPattern) {
    $startLine = -1;
    for ($i = 0; $i < count($lines); $i++) {
        if ($lines[$i] !== null && preg_match($startPattern, $lines[$i])) {
            $startLine = $i;
            break;
        }
    }
    
    if ($startLine === -1) return null;
    
    $braces = 0;
    $endLine = -1;
    for ($i = $startLine; $i < count($lines); $i++) {
        if ($lines[$i] === null) continue;
        $braces += substr_count($lines[$i], '{');
        $braces -= substr_count($lines[$i], '}');
        
        if ($braces === 0) {
            $endLine = $i;
            break;
        }
    }
    
    if ($endLine === -1) return null;
    
    $extracted = [];
    for ($i = $startLine; $i <= $endLine; $i++) {
        if ($lines[$i] !== null) {
            $extracted[] = $lines[$i];
            $lines[$i] = null; // Mark for removal
        }
    }
    
    return implode("", $extracted);
}

// Extract helpers
$h1 = extractBlock($lines, '/const getPreviewUri =/');
$h2 = extractBlock($lines, '/const getFileName =/');
$h3 = extractBlock($lines, '/const getFileExtension =/');
$h4 = extractBlock($lines, '/const getOfficePreviewUrl =/');

// Rebuild
$newLines = [];
$insertPos = -1;
foreach ($lines as $line) {
    if ($line !== null) {
        if (preg_match('/const PdfViewer = memo\(/', $line) && $insertPos === -1) {
            $insertPos = count($newLines);
        }
        $newLines[] = $line;
    }
}

// Insert before PdfViewer (which is now before CourseShow)
$helpers = implode("\n\n", array_filter([$h1, $h2, $h3, $h4])) . "\n\n";
array_splice($newLines, $insertPos, 0, [$helpers]);

file_put_contents($file, implode("", $newLines));
echo "Helpers extracted and imports fixed.\n";
