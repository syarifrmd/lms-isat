<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SessionPingController extends Controller
{
    /**
     * Dipanggil setiap 60 detik dari frontend selama user aktif.
     * Menyimpan/meng-increment menit aktif ke tabel user_daily_activity.
     * 1 baris per user per hari — jika sudah ada, minutes di-increment.
     */
    public function ping(Request $request): JsonResponse
    {
        $userId = $request->user()->id;
        $today  = now()->toDateString();

        DB::table('user_daily_activity')->upsert(
            [
                'user_id'    => $userId,
                'date'       => $today,
                'minutes'    => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            ['user_id', 'date'],                            // conflict key (unique)
            ['minutes' => DB::raw('minutes + 1'), 'updated_at' => now()], // on duplicate
        );

        return response()->json(['ok' => true]);
    }
}
