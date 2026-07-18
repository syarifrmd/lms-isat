<?php

namespace App\Providers;

use App\Listeners\ClearOnlineStatusOnLogout;
use Illuminate\Auth\Events\Logout;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Hapus status "user active" (Cache) begitu user logout, supaya tidak nyangkut
        // kehitung aktif sampai TTL cache-nya habis sendiri (5 menit).
        Event::listen(Logout::class, ClearOnlineStatusOnLogout::class);
    }
}