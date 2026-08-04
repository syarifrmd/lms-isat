<?php

use App\Models\User;

test('guests are redirected to the login page', function () {
    $this->get(route('dashboard'))->assertRedirect(route('login'));
});

test('authenticated users can visit the dashboard', function () {
    $this->actingAs($user = User::factory()->create());

    $this->get(route('dashboard'))->assertOk();
});

test('the requested employee divisions use the setting route', function () {
    $user = User::factory()->create([
        'role' => 'user',
        'division' => 'HOC',
    ]);

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertRedirect(route('setting'));

    $this->actingAs($user)
        ->get(route('setting'))
        ->assertOk();
});

test('DSE continues to use the dashboard route', function () {
    $user = User::factory()->create([
        'role' => 'user',
        'division' => 'DSE',
    ]);

    $this->actingAs($user)
        ->get(route('setting'))
        ->assertRedirect(route('dashboard'));

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk();
});
