<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;


class UpdateLastSeen
{
    public function handle(Request $request, Closure $next)
    {
        if ($user = Auth::user()) {
            Cache::put('online-user-' . $user->id, true, now()->addMinutes(5));
        }

        return $next($request);
    }
}
