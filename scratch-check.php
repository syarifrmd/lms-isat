<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Module;

foreach (Module::all() as $m) {
    if ($m->doc_url) {
        $path = str_replace('/storage/', '', $m->doc_url);
        $fullPath = storage_path('app/public/' . $path);
        if (file_exists($fullPath)) {
            $handle = fopen($fullPath, 'rb');
            $header = fread($handle, 4);
            fclose($handle);
            $hex = bin2hex($header);
            echo "Module ID: {$m->id}, Doc URL: {$m->doc_url}\n";
            echo "  Hex header: {$hex}\n";
            if (str_starts_with($header, '%PDF')) {
                echo "  Type: PDF\n";
            } elseif (str_starts_with($header, "PK\x03\x04")) {
                echo "  Type: ZIP (Office XML)\n";
                if (class_exists('\ZipArchive')) {
                    $zip = new \ZipArchive();
                    if ($zip->open($fullPath) === true) {
                        $isPptx = false;
                        $isDocx = false;
                        for ($i = 0; $i < $zip->numFiles; $i++) {
                            $name = $zip->getNameIndex($i);
                            if (str_contains($name, 'ppt/')) {
                                $isPptx = true;
                            } elseif (str_contains($name, 'word/')) {
                                $isDocx = true;
                            }
                        }
                        $zip->close();
                        if ($isPptx) {
                            echo "  Subtype: PPTX\n";
                        } elseif ($isDocx) {
                            echo "  Subtype: DOCX\n";
                        } else {
                            echo "  Subtype: Unknown ZIP\n";
                        }
                    }
                } else {
                    echo "  ZipArchive not available to check subtype.\n";
                }
            } else {
                echo "  Type: Unknown\n";
            }
        }
    }
}
