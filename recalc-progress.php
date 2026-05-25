<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Enrollment;
use App\Services\ModuleProgressService;

$enrollments = Enrollment::all();
$service = new ModuleProgressService();

$count = 0;
foreach ($enrollments as $enrollment) {
    $service->recalculateEnrollmentProgress($enrollment);
    $count++;
}

echo "Recalculated progress for $count enrollments.\n";
