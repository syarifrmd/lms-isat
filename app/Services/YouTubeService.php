<?php

namespace App\Services;

use Google\Client;
use Google\Service\YouTube;
use Illuminate\Support\Facades\Storage; // Pastikan import facade Storage

class YouTubeService
{
    protected $client;
    protected $youtube;

    public function __construct()
    {
        $this->client = new Client();
        
        // Fix for Windows Local Dev SSL Error
        if (app()->environment('local')) {
            $guzzleClient = new \GuzzleHttp\Client(['verify' => false]);
            $this->client->setHttpClient($guzzleClient);
        }

        $this->client->setApplicationName(config('app.name'));
        $this->client->setDeveloperKey(config('services.youtube.api_key'));
        
        $this->client->setClientId(config('services.youtube.client_id'));
        $this->client->setClientSecret(config('services.youtube.client_secret'));
        
        // Load Token if exists
        if (Storage::disk('local')->exists('google-token.json')) {
            $token = json_decode(Storage::disk('local')->get('google-token.json'), true);
            $this->client->setAccessToken($token);

            // Refresh token if expired
            if ($this->client->isAccessTokenExpired()) {
                try {
                    if ($this->client->getRefreshToken()) {
                        $newToken = $this->client->fetchAccessTokenWithRefreshToken($this->client->getRefreshToken());
                        
                        // Cek apakah response berisi error invalid_grant
                        if (isset($newToken['error'])) {
                            throw new \Exception($newToken['error']);
                        }

                        // Update stored token
                        $token = array_merge($token, $newToken);
                        Storage::disk('local')->put('google-token.json', json_encode($token));
                    } else {
                        // Token expired and no refresh token
                         $this->revokeToken();
                    }
                } catch (\Exception $e) {
                    \Log::error('YouTube Token Refresh Error: ' . $e->getMessage());
                    // Jika refresh gagal (misal invalid_grant), hapus token agar user dipaksa login ulang
                    $this->revokeToken();
                }
            }
        }

        $this->youtube = new YouTube($this->client);
    }
    
    // Helper untuk menghapus token
    public function revokeToken()
    {
        if (Storage::disk('local')->exists('google-token.json')) {
            Storage::disk('local')->delete('google-token.json');
        }
        // Kosongkan access token di client
        $this->client->setAccessToken(null);
    }

    // Ubah method ini agar bisa cek status login dari controller
    public function isAuthenticated()
    {
        $token = $this->client->getAccessToken();
        return $token && !$this->client->isAccessTokenExpired();
    }

    public function getAuthUrl()
    {
         $this->client->setScopes([
            'https://www.googleapis.com/auth/youtube.upload',
            'https://www.googleapis.com/auth/youtube.readonly'
        ]);
        $this->client->setAccessType('offline');
        $this->client->setPrompt('consent'); // Penting agar dapat refresh token
        $this->client->setRedirectUri(route('youtube.callback')); 
        
        return $this->client->createAuthUrl();
    }

    public function uploadVideo($videoPath, $title, $description)
    {
        try {
            $snippet = new YouTube\VideoSnippet();
            $snippet->setTitle($title);
            $snippet->setDescription($description);
            $snippet->setTags(['lms', 'module']);
            $snippet->setCategoryId("27"); // Education

            $status = new YouTube\VideoStatus();
            $status->privacyStatus = "unlisted"; // or public, private

            $video = new YouTube\Video();
            $video->setSnippet($snippet);
            $video->setStatus($status);

            $chunkSizeBytes = 1 * 1024 * 1024;
            $this->client->setDefer(true);

            $insertRequest = $this->youtube->videos->insert("status,snippet", $video);

            $media = new \Google\Http\MediaFileUpload(
                $this->client,
                $insertRequest,
                'video/*',
                null,
                true,
                $chunkSizeBytes
            );
            $media->setFileSize(filesize($videoPath));

            $status = false;
            $handle = fopen($videoPath, "rb");
            while (!$status && !feof($handle)) {
                $chunk = fread($handle, $chunkSizeBytes);
                $status = $media->nextChunk($chunk);
            }
            fclose($handle);

            $this->client->setDefer(false);

            return $status['id'] ?? null;
        } catch (\Google\Service\Exception $e) {
             // Tangkap error spesifik Google Service
            $error = json_decode($e->getMessage(), true);
             if (isset($error['error']['message']) && $error['error']['message'] == 'invalid_grant') {
                \Log::error('YouTube Upload Error (Invalid Grant): Token expired or revoked.');
                $this->revokeToken(); // Hapus token agar UI bisa minta login lagi
             }
             \Log::error('YouTube Upload Service Error: ' . $e->getMessage());
             return null;
        } catch (\Exception $e) {
            // Log error
            \Log::error('YouTube Upload Error: ' . $e->getMessage());
            // For now, if upload fails (likely due to auth), return null or throw
            return null; 
        }
    }
}
