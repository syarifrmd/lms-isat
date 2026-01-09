<?php

namespace App\Services;

use Google\Client;
use Google\Service\YouTube;

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
        if (\Storage::disk('local')->exists('google-token.json')) {
            $token = json_decode(\Storage::disk('local')->get('google-token.json'), true);
            $this->client->setAccessToken($token);

            // Refresh token if expired
            if ($this->client->isAccessTokenExpired()) {
                if ($this->client->getRefreshToken()) {
                    $newToken = $this->client->fetchAccessTokenWithRefreshToken($this->client->getRefreshToken());
                    
                    // Update stored token
                    // Merge old token (has refresh_token) with new (access_token)
                    // Often new response doesn't contain refresh_token, so we keep the old one
                    $token = array_merge($token, $newToken);
                    \Storage::disk('local')->put('google-token.json', json_encode($token));
                } else {
                    // Token expired and no refresh token
                    \Log::warning('YouTube Token Expired and no Refresh Token found.');
                }
            }
        }

        $this->youtube = new YouTube($this->client);
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
        } catch (\Exception $e) {
            // Log error
            \Log::error('YouTube Upload Error: ' . $e->getMessage());
            // For now, if upload fails (likely due to auth), return null or throw
            return null; 
        }
    }
}
