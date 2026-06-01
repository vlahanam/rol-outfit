# Phase 4: Backend OAuth Controller

**Priority:** High | **Status:** completed | **Effort:** M

## Overview

Implement OAuth controller with endpoints for initiating OAuth flow and handling callbacks. Register routes.

## Files

| Action | Path |
|--------|------|
| Create | `backend/src/internal/controllers/oauth_controller.go` |
| Create | `backend/src/internal/dto/oauth_dto.go` |
| Modify | `backend/src/internal/initialize/route.go` |

## Implementation

### 1. OAuth DTO (`oauth_dto.go`)

```go
package dto

type OAuthProviderDTO struct {
    Provider  string `json:"provider"`
    Email     string `json:"email,omitempty"`
    Name      string `json:"name,omitempty"`
    AvatarURL string `json:"avatar_url,omitempty"`
    LinkedAt  string `json:"linked_at"`
}
```

### 2. OAuth Controller (`oauth_controller.go`)

```go
package controllers

import (
    "net/url"
    "strings"
    "time"

    "github.com/gofiber/fiber/v3"
    "github.com/vlahanam/rol-outfit/src/internal/dto"
    "github.com/vlahanam/rol-outfit/src/internal/i18n"
    "github.com/vlahanam/rol-outfit/src/internal/models"
    "github.com/vlahanam/rol-outfit/src/internal/repositories"
    "github.com/vlahanam/rol-outfit/src/internal/services"
    "gorm.io/gorm"
)

const (
    oauthStateCookieName = "oauth_state"
    oauthStateCookieTTL  = 10 * time.Minute
)

// OAuthGoogle initiates Google OAuth flow
func OAuthGoogle(db *gorm.DB, oauthSvc services.OAuthService) fiber.Handler {
    return oauthInitiate(oauthSvc, models.OAuthProviderGoogle)
}

// OAuthGoogleCallback handles Google OAuth callback
func OAuthGoogleCallback(db *gorm.DB, oauthSvc services.OAuthService) fiber.Handler {
    return oauthCallback(oauthSvc, models.OAuthProviderGoogle)
}

// OAuthFacebook initiates Facebook OAuth flow
func OAuthFacebook(db *gorm.DB, oauthSvc services.OAuthService) fiber.Handler {
    return oauthInitiate(oauthSvc, models.OAuthProviderFacebook)
}

// OAuthFacebookCallback handles Facebook OAuth callback
func OAuthFacebookCallback(db *gorm.DB, oauthSvc services.OAuthService) fiber.Handler {
    return oauthCallback(oauthSvc, models.OAuthProviderFacebook)
}

func oauthInitiate(oauthSvc services.OAuthService, provider string) fiber.Handler {
    return func(c fiber.Ctx) error {
        redirectURI := c.Query("redirect_uri", "")
        
        // Validate redirect URI
        if redirectURI == "" || !oauthSvc.ValidateRedirectURI(redirectURI) {
            return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
                "error": "invalid_redirect_uri",
                "message": "redirect_uri is required and must be whitelisted",
            })
        }

        // Generate and store state in cookie
        state := oauthSvc.GenerateState()
        c.Cookie(&fiber.Cookie{
            Name:     oauthStateCookieName,
            Value:    state + ":" + redirectURI, // Store redirect URI with state
            HTTPOnly: true,
            Secure:   c.Protocol() == "https",
            SameSite: "Lax",
            MaxAge:   int(oauthStateCookieTTL.Seconds()),
            Path:     "/",
        })

        // Get authorization URL
        authURL, err := oauthSvc.GetAuthURL(provider, state, redirectURI)
        if err != nil {
            return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
                "error": "oauth_init_failed",
                "message": err.Error(),
            })
        }

        return c.Redirect().To(authURL)
    }
}

func oauthCallback(oauthSvc services.OAuthService, provider string) fiber.Handler {
    return func(c fiber.Ctx) error {
        loc := i18n.GetLocalizer(c)
        
        // Get state from cookie
        stateCookie := c.Cookies(oauthStateCookieName)
        if stateCookie == "" {
            return redirectWithError(c, "", "state_missing", "OAuth state cookie missing")
        }

        // Parse state:redirectURI from cookie
        parts := strings.SplitN(stateCookie, ":", 2)
        if len(parts) != 2 {
            return redirectWithError(c, "", "state_invalid", "Invalid state format")
        }
        expectedState := parts[0]
        redirectURI := parts[1]

        // Verify state from query matches cookie
        queryState := c.Query("state", "")
        // State from provider may include our redirectURI appended
        if !strings.HasPrefix(queryState, expectedState) {
            return redirectWithError(c, redirectURI, "state_mismatch", "OAuth state mismatch")
        }

        // Check for OAuth error
        if errCode := c.Query("error"); errCode != "" {
            errDesc := c.Query("error_description", errCode)
            return redirectWithError(c, redirectURI, errCode, errDesc)
        }

        // Get authorization code
        code := c.Query("code")
        if code == "" {
            return redirectWithError(c, redirectURI, "code_missing", "Authorization code missing")
        }

        // Clear state cookie
        c.Cookie(&fiber.Cookie{
            Name:     oauthStateCookieName,
            Value:    "",
            HTTPOnly: true,
            MaxAge:   -1,
            Path:     "/",
        })

        // Exchange code for tokens and get/create user
        tokens, err := oauthSvc.HandleCallback(c.Context(), provider, code, redirectURI)
        if err != nil {
            errMsg := loc.Get("auth.oauth_failed")
            if err == services.ErrOAuthAdminForbidden {
                errMsg = loc.Get("auth.admin_oauth_forbidden")
            }
            return redirectWithError(c, redirectURI, "oauth_failed", errMsg)
        }

        // Redirect to frontend with tokens
        return redirectWithTokens(c, redirectURI, tokens)
    }
}

func redirectWithError(c fiber.Ctx, redirectURI, errCode, errMsg string) error {
    if redirectURI == "" {
        redirectURI = "/"
    }
    u, _ := url.Parse(redirectURI)
    q := u.Query()
    q.Set("error", errCode)
    q.Set("error_description", errMsg)
    u.RawQuery = q.Encode()
    return c.Redirect().To(u.String())
}

func redirectWithTokens(c fiber.Ctx, redirectURI string, tokens *models.AuthTokens) error {
    u, _ := url.Parse(redirectURI)
    q := u.Query()
    q.Set("access_token", tokens.AccessToken)
    q.Set("refresh_token", tokens.RefreshToken)
    q.Set("token_type", tokens.TokenType)
    q.Set("expires_in", fmt.Sprintf("%d", tokens.ExpiresIn))
    u.RawQuery = q.Encode()
    return c.Redirect().To(u.String())
}

// GetMyOAuthProviders returns linked OAuth providers for current user
func GetMyOAuthProviders(db *gorm.DB) fiber.Handler {
    return func(c fiber.Ctx) error {
        userID := c.Locals("userID").(string)
        
        repo := repositories.NewOAuthRepository(db)
        providers, err := repo.FindByUserID(c.Context(), userID)
        if err != nil {
            return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
                "error": "fetch_failed",
            })
        }

        result := make([]dto.OAuthProviderDTO, len(providers))
        for i, p := range providers {
            result[i] = dto.OAuthProviderDTO{
                Provider:  p.Provider,
                LinkedAt:  p.CreatedAt.Format(time.RFC3339),
            }
            if p.Email != nil {
                result[i].Email = *p.Email
            }
            if p.Name != nil {
                result[i].Name = *p.Name
            }
        }

        return c.JSON(fiber.Map{
            "data": result,
        })
    }
}

// UnlinkOAuthProvider removes OAuth provider link
func UnlinkOAuthProvider(db *gorm.DB, oauthSvc services.OAuthService) fiber.Handler {
    return func(c fiber.Ctx) error {
        loc := i18n.GetLocalizer(c)
        userID := c.Locals("userID").(string)
        provider := c.Params("provider")

        if provider != models.OAuthProviderGoogle && provider != models.OAuthProviderFacebook {
            return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
                "error": "invalid_provider",
            })
        }

        err := oauthSvc.UnlinkProvider(c.Context(), userID, provider)
        if err != nil {
            if err.Error() == "cannot unlink last login method" {
                return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
                    "error": "cannot_unlink_last",
                    "message": loc.Get("auth.cannot_unlink_last_method"),
                })
            }
            return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
                "error": "unlink_failed",
            })
        }

        return c.JSON(fiber.Map{
            "message": "provider unlinked",
        })
    }
}
```

### 3. Register Routes (`route.go`)

Add to InitRoutes function:

```go
func InitRoutes(app *fiber.App, db *gorm.DB, cfg *AppConfig) {
    // ... existing code ...

    // Create OAuth service
    userRepo := repositories.NewUserRepository(db)
    refreshTokenRepo := repositories.NewRefreshTokenRepository(db)
    oauthRepo := repositories.NewOAuthRepository(db)
    authSvc := services.NewAuthService(userRepo, refreshTokenRepo, cfg.JWTSecret)
    oauthSvc := services.NewOAuthService(
        cfg.GoogleClientID, cfg.GoogleClientSecret,
        cfg.FacebookAppID, cfg.FacebookAppSecret,
        cfg.OAuthCallbackBaseURL,
        cfg.OAuthAllowedRedirects,
        oauthRepo, userRepo, authSvc,
    )

    // OAuth routes (public)
    oauth := auth.Group("/oauth")
    oauth.Get("/google", controllers.OAuthGoogle(db, oauthSvc))
    oauth.Get("/google/callback", controllers.OAuthGoogleCallback(db, oauthSvc))
    oauth.Get("/facebook", controllers.OAuthFacebook(db, oauthSvc))
    oauth.Get("/facebook/callback", controllers.OAuthFacebookCallback(db, oauthSvc))

    // OAuth provider management (authenticated)
    me.Get("/me/oauth-providers", controllers.GetMyOAuthProviders(db))
    me.Delete("/me/oauth-providers/:provider", controllers.UnlinkOAuthProvider(db, oauthSvc))
    
    // ... rest of routes ...
}
```

## i18n Messages

Add to locale files:

```json
// vi.json
{
  "auth": {
    "oauth_failed": "Đăng nhập thất bại. Vui lòng thử lại.",
    "admin_oauth_forbidden": "Tài khoản admin không thể đăng nhập bằng OAuth.",
    "cannot_unlink_last_method": "Không thể gỡ phương thức đăng nhập cuối cùng."
  }
}

// ja.json
{
  "auth": {
    "oauth_failed": "ログインに失敗しました。もう一度お試しください。",
    "admin_oauth_forbidden": "管理者アカウントはOAuthでログインできません。",
    "cannot_unlink_last_method": "最後のログイン方法を解除することはできません。"
  }
}
```

## Todo

- [ ] Create oauth_dto.go
- [ ] Create oauth_controller.go
- [ ] Add fmt import to controller
- [ ] Update route.go with OAuth routes
- [ ] Add i18n messages (vi, ja, en)
- [ ] Test OAuth initiation endpoint
- [ ] Test callback handling

## Verification

```bash
# Test OAuth initiation
curl -v "http://localhost:8080/api/v1/auth/oauth/google?redirect_uri=http://localhost:3000/login/callback"
# Should redirect to Google with state cookie set

# Test invalid redirect
curl "http://localhost:8080/api/v1/auth/oauth/google?redirect_uri=http://evil.com"
# Should return 400 error
```
