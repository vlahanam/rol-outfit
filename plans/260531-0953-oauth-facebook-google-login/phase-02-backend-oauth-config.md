# Phase 2: Backend OAuth Config

**Priority:** High | **Status:** completed | **Effort:** S

## Overview

Add OAuth configuration (Google, Facebook credentials) to AppConfig and environment.

## Files

| Action | Path |
|--------|------|
| Modify | `backend/src/internal/initialize/loadconfig.go` |
| Modify | `docker/.env.example` |
| Modify | `docker/docker-compose.yml` (pass env vars) |

## Implementation

### 1. Update AppConfig (`loadconfig.go`)

Add OAuth fields to AppConfig struct:

```go
type AppConfig struct {
    // ... existing fields ...
    
    // OAuth
    GoogleClientID       string
    GoogleClientSecret   string
    FacebookAppID        string
    FacebookAppSecret    string
    OAuthAllowedRedirects []string // whitelist of allowed redirect URIs
    OAuthCallbackBaseURL string   // e.g., http://localhost:8080
}
```

Update LoadConfig():

```go
func LoadConfig() *AppConfig {
    redirects := getEnv("OAUTH_ALLOWED_REDIRECT_URIS", "http://localhost:3000/login/callback")
    
    return &AppConfig{
        // ... existing ...
        
        GoogleClientID:       getEnv("GOOGLE_CLIENT_ID", ""),
        GoogleClientSecret:   getEnv("GOOGLE_CLIENT_SECRET", ""),
        FacebookAppID:        getEnv("FACEBOOK_APP_ID", ""),
        FacebookAppSecret:    getEnv("FACEBOOK_APP_SECRET", ""),
        OAuthAllowedRedirects: strings.Split(redirects, ","),
        OAuthCallbackBaseURL: getEnv("OAUTH_CALLBACK_BASE_URL", "http://localhost:8080"),
    }
}
```

### 2. Environment Variables (`docker/.env.example`)

```bash
# OAuth - Google
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# OAuth - Facebook
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret

# OAuth Settings
OAUTH_ALLOWED_REDIRECT_URIS=http://localhost:3000/login/callback
OAUTH_CALLBACK_BASE_URL=http://localhost:8080
```

### 3. Docker Compose (`docker-compose.yml`)

Add to backend service environment:

```yaml
services:
  backend:
    environment:
      # ... existing ...
      - GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
      - GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
      - FACEBOOK_APP_ID=${FACEBOOK_APP_ID}
      - FACEBOOK_APP_SECRET=${FACEBOOK_APP_SECRET}
      - OAUTH_ALLOWED_REDIRECT_URIS=${OAUTH_ALLOWED_REDIRECT_URIS}
      - OAUTH_CALLBACK_BASE_URL=${OAUTH_CALLBACK_BASE_URL}
```

## OAuth Provider Setup

### Google Cloud Console

1. Go to https://console.cloud.google.com/apis/credentials
2. Create OAuth 2.0 Client ID (Web application)
3. Add authorized redirect URI: `http://localhost:8080/api/v1/auth/oauth/google/callback`
4. Copy Client ID and Client Secret

### Facebook Developer

1. Go to https://developers.facebook.com/apps
2. Create App → Consumer → Set up Facebook Login
3. Add Valid OAuth Redirect URI: `http://localhost:8080/api/v1/auth/oauth/facebook/callback`
4. Copy App ID and App Secret

## Todo

- [ ] Add OAuth fields to AppConfig struct
- [ ] Update LoadConfig() with new env vars
- [ ] Add import for `strings` package
- [ ] Update docker/.env.example
- [ ] Update docker-compose.yml
- [ ] Create Google OAuth credentials
- [ ] Create Facebook OAuth credentials
- [ ] Test config loading

## Verification

```go
// In main.go or test
cfg := initialize.LoadConfig()
fmt.Println("Google:", cfg.GoogleClientID != "")
fmt.Println("Facebook:", cfg.FacebookAppID != "")
```
