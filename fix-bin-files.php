<?php
/**
 * One-time script to rename .bin document files back to their real extension.
 * Run: php fix-bin-files.php
 */
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Module;

echo "Scanning modules for .bin document files...\n\n";

$fixed   = 0;
$skipped = 0;
$missing = 0;

foreach (Module::all() as $module) {
    if (!$module->doc_url) continue;
    if (!str_ends_with(strtolower($module->doc_url), '.bin')) continue;

    $oldUrl      = $module->doc_url;
    $oldRelPath  = str_replace('/storage/', '', $oldUrl);
    $oldFullPath = storage_path('app/public/' . $oldRelPath);

    if (!file_exists($oldFullPath)) {
        echo "[MISSING] Module {$module->id}: {$oldUrl}\n";
        $missing++;
        continue;
    }

    // Read the first 4 bytes to detect file type
    $handle = fopen($oldFullPath, 'rb');
    $header = fread($handle, 4);
    fclose($handle);

    $newExt = null;
    if (str_starts_with($header, '%PDF')) {
        $newExt = 'pdf';
    } elseif (str_starts_with($header, "PK\x03\x04")) {
        // Could be pptx, docx, xlsx — default to pptx since those are the common uploads
        $newExt = 'pptx';
    }

    if ($newExt === null) {
        echo "[SKIP]    Module {$module->id}: {$oldUrl} — unknown type (hex: " . bin2hex($header) . ")\n";
        $skipped++;
        continue;
    }

    $newRelPath  = preg_replace('/\.bin$/i', '.' . $newExt, $oldRelPath);
    $newFullPath = storage_path('app/public/' . $newRelPath);
    $newUrl      = '/storage/' . $newRelPath;

    if (rename($oldFullPath, $newFullPath)) {
        $module->update(['doc_url' => $newUrl]);
        echo "[FIXED]   Module {$module->id}: {$oldUrl}  →  {$newUrl}\n";
        $fixed++;
    } else {
        echo "[ERROR]   Module {$module->id}: Could not rename {$oldFullPath}\n";
        $skipped++;
    }
}

echo "\nDone. Fixed: {$fixed}, Skipped: {$skipped}, Missing: {$missing}\n";
