<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // The order matters because courses require a trainer and modules require courses.
        $this->call([
            UserSeeder::class,
            CourseSeeder::class,
            CourseDivisionSeeder::class,
            ModuleSeeder::class,
        ]);
    }
}
