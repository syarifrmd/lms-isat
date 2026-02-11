<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $employees = [
            ['id' => '2026A1', 'name' => 'John Doe', 'region' => 'Jakarta'],
            ['id' => '2026A2', 'name' => 'Jane Smith', 'region' => 'Bandung'],
            ['id' => '2026A3', 'name' => 'Bob Wilson', 'region' => 'Surabaya'],
            ['id' => '2026A4', 'name' => 'Alice Johnson', 'region' => 'Medan'],
        ];

        foreach ($employees as $emp) {
            User::create([
                'id' => $emp['id'], // NIK
                'name' => $emp['name'],
                'region' => $emp['region'],
                'is_registered' => false, // Belum terdaftar
                'email' => null, // Belum ada email
                'password' => null,
            ]);
        }

        // Seed courses and modules
        $this->call([
            CourseSeeder::class,
            ModuleSeeder::class,
        ]);
    }
}