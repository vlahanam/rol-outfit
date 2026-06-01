package controllers

import (
	"fmt"
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

func OAuthGoogle(oauthSvc services.OAuthService) fiber.Handler {
	return oauthInitiate(oauthSvc, models.OAuthProviderGoogle)
}

func OAuthGoogleCallback(oauthSvc services.OAuthService) fiber.Handler {
	return oauthCallback(oauthSvc, models.OAuthProviderGoogle)
}

func OAuthFacebook(oauthSvc services.OAuthService) fiber.Handler {
	return oauthInitiate(oauthSvc, models.OAuthProviderFacebook)
}

func OAuthFacebookCallback(oauthSvc services.OAuthService) fiber.Handler {
	return oauthCallback(oauthSvc, models.OAuthProviderFacebook)
}

func oauthInitiate(oauthSvc services.OAuthService, provider string) fiber.Handler {
	return func(c fiber.Ctx) error {
		redirectURI := c.Query("redirect_uri", "")

		if redirectURI == "" || !oauthSvc.ValidateRedirectURI(redirectURI) {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error":   "invalid_redirect_uri",
				"message": "redirect_uri is required and must be whitelisted",
			})
		}

		state := oauthSvc.GenerateState()
		c.Cookie(&fiber.Cookie{
			Name:     oauthStateCookieName,
			Value:    state + ":" + redirectURI,
			HTTPOnly: true,
			Secure:   c.Protocol() == "https",
			SameSite: "Lax",
			MaxAge:   int(oauthStateCookieTTL.Seconds()),
			Path:     "/",
		})

		authURL, err := oauthSvc.GetAuthURL(provider, state, redirectURI)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error":   "oauth_init_failed",
				"message": err.Error(),
			})
		}

		return c.Redirect().To(authURL)
	}
}

func oauthCallback(oauthSvc services.OAuthService, provider string) fiber.Handler {
	return func(c fiber.Ctx) error {
		lang := i18n.LangFromHeader(c.Get("Accept-Language"))

		stateCookie := c.Cookies(oauthStateCookieName)
		if stateCookie == "" {
			return redirectWithError(c, "", "state_missing", "OAuth state cookie missing")
		}

		parts := strings.SplitN(stateCookie, ":", 2)
		if len(parts) != 2 {
			return redirectWithError(c, "", "state_invalid", "Invalid state format")
		}
		expectedState := parts[0]
		redirectURI := parts[1]

		queryState := c.Query("state", "")
		if !strings.HasPrefix(queryState, expectedState) {
			return redirectWithError(c, redirectURI, "state_mismatch", "OAuth state mismatch")
		}

		if errCode := c.Query("error"); errCode != "" {
			errDesc := c.Query("error_description", errCode)
			return redirectWithError(c, redirectURI, errCode, errDesc)
		}

		code := c.Query("code")
		if code == "" {
			return redirectWithError(c, redirectURI, "code_missing", "Authorization code missing")
		}

		c.Cookie(&fiber.Cookie{
			Name:     oauthStateCookieName,
			Value:    "",
			HTTPOnly: true,
			MaxAge:   -1,
			Path:     "/",
		})

		tokens, err := oauthSvc.HandleCallback(c.Context(), provider, code, redirectURI)
		if err != nil {
			errMsg := i18n.T(lang, "auth.oauth_failed")
			if err == services.ErrOAuthAdminForbidden {
				errMsg = i18n.T(lang, "auth.admin_oauth_forbidden")
			}
			return redirectWithError(c, redirectURI, "oauth_failed", errMsg)
		}

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
				Provider: p.Provider,
				LinkedAt: p.CreatedAt.Format(time.RFC3339),
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

func UnlinkOAuthProvider(oauthSvc services.OAuthService) fiber.Handler {
	return func(c fiber.Ctx) error {
		lang := i18n.LangFromHeader(c.Get("Accept-Language"))
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
					"error":   "cannot_unlink_last",
					"message": i18n.T(lang, "auth.cannot_unlink_last_method"),
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
