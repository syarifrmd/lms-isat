<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class LeaderboardController extends Controller
{
    public function index()
    {
        // 1. Ambil 50 user teratas berdasarkan XP tertinggi
        $topUsers = User::orderBy('xp', 'desc')
            ->take(50)
            ->get();

        // 2. Format data untuk mempermudah frontend (tambah ranking)
        $leaderboardData = $topUsers->map(function ($user, $index) {
            return [
                'rank' => $index + 1,
                'id' => $user->id,
                'name' => $user->name,
                'avatar' => $user->avatar, // Pastikan kolom ini ada atau gunakan gravatar/placeholder
                'xp' => $user->xp,
                'is_current_user' => $user->id === Auth::id(),
            ];
        });

        // 3. Cari ranking user yang sedang login (jika tidak masuk top 50)
        $currentUserRank = User::where('xp', '>', Auth::user()->xp)->count() + 1;

        return Inertia::render('leaderboard/leaderboard', [
            'leaderboard' => $leaderboardData,
            'currentUser' => [
                'data' => Auth::user(),
                'rank' => $currentUserRank
            ]
        ]);
    }
}