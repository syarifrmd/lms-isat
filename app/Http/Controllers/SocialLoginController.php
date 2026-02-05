<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Mail\EmployeeVerificationLink; // Pastikan ini di-import
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\URL;
use Inertia\Inertia;
use Laravel\Socialite\Facades\Socialite;

class SocialLoginController extends Controller
{
    // ... redirectToGoogle ...
    public function redirectToGoogle()
    {
        return Socialite::driver('google')
            ->scopes(['openid', 'profile', 'email'])
            ->redirect();
    }

    public function handleGoogleCallback()
    {
        try {
            Log::info('=== GOOGLE LOGIN START ===');

            $googleUser = Socialite::driver('google')
                ->stateless()
                ->setHttpClient(new \GuzzleHttp\Client(['verify' => false]))
                ->user();
            
            // 1. Cek User Exist
            $existingUser = User::where('email', $googleUser->getEmail())
                ->where('is_registered', true)
                ->first();

            if ($existingUser) {
                Auth::login($existingUser);
                return redirect()->route('dashboard');
            }

            // 2. Kirim Email Verifikasi
            // Kita encode data Google ke dalam URL supaya aman dan stateless
            $verificationUrl = URL::temporarySignedRoute(
                'register.verify-email-entry',
                now()->addMinutes(30),
                [
                    'email' => $googleUser->getEmail(),
                    'name' => $googleUser->getName(),
                    'google_id' => $googleUser->getId(),
                    'avatar' => $googleUser->getAvatar(),
                ]
            );

            Log::info('Sending verification email to: ' . $googleUser->getEmail());

            try {
                Mail::to($googleUser->getEmail())->send(new EmployeeVerificationLink($verificationUrl));
            } catch (\Exception $e) {
                Log::error('Mail Error: ' . $e->getMessage());
                return redirect()->route('home')->withErrors(['error' => 'Gagal mengirim email verifikasi.']);
            }

            // Redirect ke halaman "Cek Inbox Anda"
            return Inertia::render('auth/check-inbox', [
                'email' => $googleUser->getEmail()
            ]);

        } catch (\Exception $e) {
            Log::error('Google Login Error: ' . $e->getMessage());
            return redirect()->route('home')->withErrors([
                'error' => 'Gagal login dengan Google: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Handle klik link dari email
     */
    public function verifyEmailLink(Request $request)
    {
        // Validasi Signature URL (Expired atau Tampered)
        if (!$request->hasValidSignature()) {
            return redirect()->route('home')->withErrors(['error' => 'Link verifikasi tidak valid atau sudah kadaluarsa.']);
        }

        // Ambil data dari query param
        $googleData = [
            'email' => $request->query('email'),
            'name' => $request->query('name'),
            'google_id' => $request->query('google_id'),
            'avatar' => $request->query('avatar'),
        ];

        // Simpan ke session
        Session::put('google_user', $googleData);

        // Redirect ke form NIK
        return redirect()->route('register.verify-nik');
    }

    // ... showVerifyNikForm & verifyNik TETAP SAMA seperti sebelumnya ...
    public function showVerifyNikForm()
    {
        $googleUser = Session::get('google_user');

        if (!$googleUser) {
            return redirect()->route('login.google')->withErrors(['error' => 'Sesi habis.']);
        }

        return Inertia::render('auth/verify-employee', [
            'email' => $googleUser['email'],
            'name' => $googleUser['name'],
        ]);
    }

    public function verifyNik(Request $request)
    {
        $request->validate(['nik' => 'required|string']);
        $googleUser = Session::get('google_user');

        if (!$googleUser) return redirect()->route('login.google');

        $user = User::where('id', $request->nik)->where('is_registered', false)->first();

        if (!$user) {
            return back()->withErrors(['nik' => 'NIK tidak ditemukan atau sudah terdaftar.']);
        }

        $user->update([
            'name' => $googleUser['name'],
            'email' => $googleUser['email'],
            'email_verified_at' => now(),
            'password' => Hash::make(uniqid()),
            'google_id' => $googleUser['google_id'],
            'avatar' => $googleUser['avatar'],
            'is_registered' => true,
        ]);

        Session::forget('google_user');
        Auth::login($user);

        return redirect()->route('dashboard');
    }
}