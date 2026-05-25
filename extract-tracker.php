<?php

$file = 'resources/js/pages/Courses/Show.tsx';
$content = file_get_contents($file);

// Find CourseShow boundaries
if (preg_match('/export default function CourseShow\(/', $content, $matches, PREG_OFFSET_CAPTURE)) {
    $courseShowStart = $matches[0][1];
}

// Extract renderDocPreview
$renderDocStartPattern = '/const renderDocPreview = \([^)]*\) => \{/';
if (preg_match($renderDocStartPattern, $content, $matches, PREG_OFFSET_CAPTURE, $courseShowStart)) {
    $renderDocStart = $matches[0][1];
    $braces = 0;
    $renderDocEnd = 0;
    for ($i = $renderDocStart; $i < strlen($content); $i++) {
        if ($content[$i] === '{') $braces++;
        if ($content[$i] === '}') {
            $braces--;
            if ($braces === 0) {
                $renderDocEnd = $i + 1;
                break;
            }
        }
    }
    
    $renderDocCode = substr($content, $renderDocStart, $renderDocEnd - $renderDocStart);
    $content = substr_replace($content, '', $renderDocStart, $renderDocEnd - $renderDocStart);
}

// Extract ModuleProgressTracker
$trackerStartPattern = '/const ModuleProgressTracker = \([^)]*\) => \{/';
if (preg_match($trackerStartPattern, $content, $matches, PREG_OFFSET_CAPTURE, $courseShowStart)) {
    $trackerStart = $matches[0][1];
    $braces = 0;
    $trackerEnd = 0;
    for ($i = $trackerStart; $i < strlen($content); $i++) {
        if ($content[$i] === '{') $braces++;
        if ($content[$i] === '}') {
            $braces--;
            if ($braces === 0) {
                $trackerEnd = $i + 1;
                break;
            }
        }
    }
    
    $trackerCode = substr($content, $trackerStart, $trackerEnd - $trackerStart);
    $content = substr_replace($content, '', $trackerStart, $trackerEnd - $trackerStart);
}

// Now insert them before CourseShow
$newProps = "{ module, isTrainer, previewModuleId, setPreviewModuleId, setCurrentProgress, setLocalModules }: { module: Module, isTrainer: boolean, previewModuleId: number | null, setPreviewModuleId: (id: number | null) => void, setCurrentProgress: (p: number) => void, setLocalModules: React.Dispatch<React.SetStateAction<Module[]>> }";

$trackerCode = preg_replace('/const ModuleProgressTracker = \([^)]*\) => \{/', "const ModuleProgressTracker = memo(function ModuleProgressTracker($newProps) {", $trackerCode);

$renderDocCode = preg_replace('/const renderDocPreview = \(([^)]*)\) => \{/', "const renderDocPreview = ($1, previewModuleId: number | null, setPreviewModuleId: (id: number | null) => void) => {", $renderDocCode);

// update calls inside trackerCode
$trackerCode = str_replace('renderDocPreview(module.doc_url, module.id)', 'renderDocPreview(module.doc_url, module.id, previewModuleId, setPreviewModuleId)', $trackerCode);

$insertPos = strpos($content, 'export default function CourseShow');
$insertCode = $renderDocCode . "\n\n" . $trackerCode . "\n\n";

$content = substr_replace($content, $insertCode, $insertPos, 0);

// update calls in CourseShow
$callOld = '<ModuleProgressTracker module={module} />';
$callNew = '<ModuleProgressTracker module={module} isTrainer={isTrainer} previewModuleId={previewModuleId} setPreviewModuleId={setPreviewModuleId} setCurrentProgress={setCurrentProgress} setLocalModules={setLocalModules} />';

$content = str_replace($callOld, $callNew, $content);

file_put_contents($file, $content);
echo "Extracted successfully.\n";
