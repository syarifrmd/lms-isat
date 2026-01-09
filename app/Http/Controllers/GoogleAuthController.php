<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Google\Client;
use Illuminate\Support\Facades\Storage;

class GoogleAuthController extends Controller
{
    public function redirectToGoogle()
    {
        $client = new Client();
        
        if (app()->environment('local')) {
            $guzzleClient = new \GuzzleHttp\Client(['verify' => false]);
            $client->setHttpClient($guzzleClient);
        }

        $client->setClientId(config('services.youtube.client_id'));
        $client->setClientSecret(config('services.youtube.client_secret'));
        $client->setRedirectUri(config('services.youtube.redirect'));
        
        // Scopes for YouTube Uploads
        $client->addScope('https://www.googleapis.com/auth/youtube.upload');
        $client->addScope('https://www.googleapis.com/auth/youtube.readonly');
        $client->setAccessType('offline'); // Vital for refresh tokens
        $client->setPrompt('consent'); // Force consent to get refresh token

        $authUrl = $client->createAuthUrl();

        return \Inertia\Inertia::location($authUrl);
    }

    public function handleGoogleCallback(Request $request)
    {
        $code = $request->input('code');

        if (!$code) {
            return redirect('/')->withErrors(['error' => 'Authorization failed']);
        }

        $client = new Client();

        if (app()->environment('local')) {
            $guzzleClient = new \GuzzleHttp\Client(['verify' => false]);
            $client->setHttpClient($guzzleClient);
        }

        $client->setClientId(config('services.youtube.client_id'));
        $client->setClientSecret(config('services.youtube.client_secret'));
        $client->setRedirectUri(config('services.youtube.redirect'));

        try {
            $token = $client->fetchAccessTokenWithAuthCode($code);
            
            if (isset($token['error'])) {
                throw new \Exception($token['error']);
            }

            // Store the token (simulated for single tenant app)
            // In a multi-tenant app, this would be in the users table or a linked social_accounts table
            Storage::disk('local')->put('google-token.json', json_encode($token));

            return redirect()->route('dashboard')->with('success', 'YouTube account connected successfully!');

        } catch (\Exception $e) {
            return redirect()->route('dashboard')->withErrors(['error' => 'Failed to connect YouTube: ' . $e->getMessage()]);
        }
    }
}
