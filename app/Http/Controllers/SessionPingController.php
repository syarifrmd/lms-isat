<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class SessionPingController extends Controller
{
    /**
     * Dipanggil setiap 60 detik dari frontend selama user aktif.
     * Menyimpan jumlah menit aktif per hari ke dalam cache.
     * Tidak membutuhkan tabel baru — menggunakan driver cache yang sudah dikonfigurasi.
     */
    public function ping(Request $request): JsonResponse
    {
        $userId  = $request->user()->id;
        $dateKey = now()->format('Y-m-d');
        $cacheKey = "activity_minutes_{$userId}_{$dateKey}";

        // Tambah 1 menit dan perbarui TTL sekaligus
        // Cache::increment mengembalikan nilai baru — langsung dipakai untuk refresh TTL
        $newMinutes = Cache::increment($cacheKey);
        Cache::put($cacheKey, $newMinutes, now()->addDays(9));

        return response()->json(['ok' => true]);
    }
}
