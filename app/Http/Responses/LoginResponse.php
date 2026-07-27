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

        // Role 'user' (student) langsung diarahkan ke halaman Summary setelah login,
        // kecuali divisi DSE (memang di-block 403 di StudentController::denyIfRestrictedDivision()).
        if ($role === 'user' && $division !== 'DSE') {
            return redirect()->route('students.index');
        }

        return redirect()->intended(route('dashboard', absolute: false));
    }
}
