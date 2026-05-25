<?php
$file = __DIR__ . '/resources/js/pages/Courses/Show.tsx';
$lines = file($file);

// Validate lines
if (strpos($lines[191], 'function PdfViewer') === false) {
    die("Error: Line 192 is not PdfViewer. It is: " . $lines[191]);
}
if (strpos($lines[713], '}') === false || strpos($lines[715], 'renderDocPreview') === false) {
    die("Error: Line 714 is not the end of OfficeViewer.");
}

$extracted = array_slice($lines, 191, 714 - 191);

// Remove extracted lines
array_splice($lines, 191, 714 - 191);

$insertIndex = -1;
foreach ($lines as $i => $line) {
    if (strpos($line, 'export default function CourseShow') !== false) {
        $insertIndex = $i;
        break;
    }
}

if ($insertIndex !== -1) {
    array_splice($lines, $insertIndex, 0, $extracted);
    file_put_contents($file, implode("", $lines));
    echo "Successfully moved PdfViewer, PremiumVideoPlayer, and OfficeViewer outside of CourseShow.\n";
} else {
    echo "Could not find CourseShow.\n";
}
