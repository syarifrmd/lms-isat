<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;


class MarkJourneyActive
{
    public function handle(Request $request, Closure $next)
    {
        if ($user = Auth::user()) {
            $journeyId = $request->route('id') ?? $request->route('journey');

            if ($journeyId) {
                Cache::put('active-journey-' . $journeyId . '-' . $user->id, true, now()->addSeconds(20));
            }
        }

        return $next($request);
    }
}