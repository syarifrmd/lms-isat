<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // All accounts use the password "password". Use the primary key as the
        // lookup key so the seeder can be run repeatedly without duplicates.
        $users = [
            [
                'id' => 'ADMIN01',
                'name' => 'Admin Demo',
                'username' => 'admin.demo',
                'email' => 'admin@example.com',
                'role' => 'admin',
                'division' => 'DSE',
                'region' => 'Jakarta',
            ],
            [
                'id' => 'TRAINER01',
                'name' => 'Trainer Demo',
                'username' => 'trainer.demo',
                'email' => 'trainer@example.com',
                'role' => 'trainer',
                'division' => 'DSE',
                'region' => 'Jakarta',
            ],
            [
                'id' => 'LEARNER01',
                'name' => 'Learner Demo',
                'username' => 'learner.demo',
                'email' => 'learner@example.com',
                'role' => 'user',
                'division' => 'DSE',
                'region' => 'Jakarta',
            ],
            [
                'id' => '2026A1',
                'name' => 'John Doe',
                'username' => 'john.doe',
                'email' => 'john.doe@example.com',
                'role' => 'user',
                'division' => 'Sales',
                'region' => 'Jakarta',
            ],
            [
                'id' => '2026A2',
                'name' => 'Jane Smith',
                'username' => 'jane.smith',
                'email' => 'jane.smith@example.com',
                'role' => 'user',
                'division' => 'Marketing',
                'region' => 'Bandung',
            ],
        ];

        foreach ($users as $user) {
            User::updateOrCreate(
                ['id' => $user['id']],
                array_merge($user, [
                    'password' => Hash::make('password'),
                    'email_verified_at' => now(),
                    'is_registered' => true,
                ])
            );
        }

        $this->command->info('Demo users seeded successfully.');
    }
}
