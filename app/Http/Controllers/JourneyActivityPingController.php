<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;

class JourneyActivityPingController extends Controller
{
    public function ping(Request $request, $journeyId)
    {
        if ($user = Auth::user()) {
            Cache::put('active-journey-' . $journeyId . '-' . $user->id, true, now()->addSeconds(20));
        }

        return response()->json(['ok' => true]);
    }
}
