<?php

namespace App\Listeners;

use Illuminate\Auth\Events\Logout;
use Illuminate\Support\Facades\Cache;

class ClearOnlineStatusOnLogout
{
    public function handle(Logout $event): void
    {
        if ($event->user) {
            Cache::forget('online-user-' . $event->user->id);
        }
    }
}
