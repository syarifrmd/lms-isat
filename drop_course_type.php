<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    \Illuminate\Support\Facades\DB::statement('ALTER TABLE `lms-isat`.journeys DROP COLUMN course_type');
    echo "Dropped from lms-isat\n";
} catch (\Exception $e) {
    echo "lms-isat error: " . $e->getMessage() . "\n";
}

try {
    \Illuminate\Support\Facades\DB::statement('ALTER TABLE lms_ioh.journeys DROP COLUMN course_type');
    echo "Dropped from lms_ioh\n";
} catch (\Exception $e) {
    echo "lms_ioh error: " . $e->getMessage() . "\n";
}
