<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string $role): Response
    {
        if (!auth()->check()) {
            return redirect('/login');
        }

        $userRole = auth()->user()->role;

        // Admin has access to everything
        if ($userRole === 'admin') {
            return $next($request);
        }

        // Check for specific role matches
        if ($userRole === $role) {
            return $next($request);
        }
        
        // Additional Logic: Trainer can access 'user' role routes if needed? 
        // For now, strict match or admin override seems safest based on intent.
        // However, looking at the previous broken logic: ($role !== 'trainer')
        // It seemed to imply that if specific role was trainer, the check was skipped? No, that was a bug.
        
        abort(403, 'Unauthorized action.');
    }
}
