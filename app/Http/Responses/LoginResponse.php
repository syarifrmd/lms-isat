<?php

namespace App\Http\Responses;

use Illuminate\Http\Request;
use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;

class LoginResponse implements LoginResponseContract
{
    public function toResponse($request)
    {
        /** @var Request $request */
        $user = $request->user();
        $role = $user->role;
        $division = strtoupper(trim((string) ($user->division ?? '')));

        // Manager divisions load Summary at /dashboard; DSE keeps its dashboard flow.
        if ($role === 'user' && $division !== 'DSE') {
            return redirect()->route('dashboard');
        }

        return redirect()->intended(route('dashboard', absolute: false));
    }
}
