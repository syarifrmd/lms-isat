# YouTube Upload Setup Guide

## Current Status
✅ Module creation works WITHOUT video upload  
⚠️ YouTube video upload requires OAuth2 (not yet configured)

## Environment Variables (Already Set)
```env
YOUTUBE_API_KEY=AIzaSyCW7Dkhv04UQo1NkW5Mziz1tNZNgYd9f08
YOUTUBE_DEBUG=true
YOUTUBE_BASE_URL=https://www.googleapis.com/youtube/v3
```

## To Enable YouTube Video Upload

### 1. Setup Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **YouTube Data API v3**
4. Create **OAuth 2.0 Credentials**:
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:8000/auth/youtube/callback`

### 2. Download OAuth Credentials
1. Download the `client_secret.json` file
2. Save it to: `storage/app/google/client_secret.json`

### 3. Update .env
```env
YOUTUBE_OAUTH_CLIENT_ID=your_client_id
YOUTUBE_OAUTH_CLIENT_SECRET=your_client_secret
YOUTUBE_OAUTH_REDIRECT_URI=http://localhost:8000/auth/youtube/callback
```

### 4. Update YouTubeService.php
```php
// In __construct()
$this->client->setAuthConfig(storage_path('app/google/client_secret.json'));
$this->client->setRedirectUri(config('services.youtube.oauth_redirect_uri'));
$this->client->setAccessType('offline');
$this->client->setPrompt('consent');
```

### 5. Add OAuth Flow
Create a route to authenticate:
```php
// routes/web.php
Route::get('/auth/youtube', [YouTubeAuthController::class, 'redirect']);
Route::get('/auth/youtube/callback', [YouTubeAuthController::class, 'callback']);
```

### 6. Store Access Token
After OAuth flow completes, store the access token in database or session:
```php
$this->client->setAccessToken($storedToken);
```

## Alternative: Service Account (For Server-Only)
If you want server-side only uploads without user OAuth:
1. Create a **Service Account** in Google Cloud Console
2. Download the JSON key file
3. Set in YouTubeService:
```php
$this->client->setAuthConfig(storage_path('app/google/service-account.json'));
```

## Current Behavior
- ✅ Module can be created without video
- ✅ Document upload/link works
- ✅ Rich text content works
- ⚠️ Video upload will show warning and skip silently
- 📝 Module will be created successfully even if video upload fails

## References
- [YouTube Data API v3 Docs](https://developers.google.com/youtube/v3)
- [Google API PHP Client](https://github.com/googleapis/google-api-php-client)
