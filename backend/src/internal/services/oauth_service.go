package services

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/google/uuid"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/facebook"
	"golang.org/x/oauth2/google"

	"github.com/vlahanam/rol-outfit/src/internal/models"
	"github.com/vlahanam/rol-outfit/src/internal/repositories"
)

var (
	ErrOAuthStateMismatch  = errors.New("oauth state mismatch")
	ErrOAuthAdminForbidden = errors.New("admin accounts cannot use oauth")
	ErrOAuthProviderError  = errors.New("oauth provider error")
	ErrOAuthUserNotFound   = errors.New("oauth user info not found")
)

type OAuthUserInfo struct {
	ID        string
	Email     string
	Name      string
	AvatarURL string
}

type OAuthService interface {
	GetAuthURL(provider, state, redirectURI string) (string, error)
	HandleCallback(ctx context.Context, provider, code, redirectURI string) (*models.AuthTokens, error)
	GetLinkedProviders(ctx context.Context, userID string) ([]models.UserOAuthProvider, error)
	UnlinkProvider(ctx context.Context, userID, provider string) error
	GenerateState() string
	ValidateRedirectURI(uri string) bool
}

type oauthService struct {
	googleConfig     *oauth2.Config
	facebookConfig   *oauth2.Config
	allowedRedirects []string
	callbackBaseURL  string

	oauthRepo   repositories.OAuthRepository
	userRepo    repositories.UserRepository
	authService AuthService
}

func NewOAuthService(
	googleClientID, googleClientSecret string,
	facebookAppID, facebookAppSecret string,
	callbackBaseURL string,
	allowedRedirects []string,
	oauthRepo repositories.OAuthRepository,
	userRepo repositories.UserRepository,
	authService AuthService,
) OAuthService {
	return &oauthService{
		googleConfig: &oauth2.Config{
			ClientID:     googleClientID,
			ClientSecret: googleClientSecret,
			Scopes:       []string{"openid", "email", "profile"},
			Endpoint:     google.Endpoint,
		},
		facebookConfig: &oauth2.Config{
			ClientID:     facebookAppID,
			ClientSecret: facebookAppSecret,
			Scopes:       []string{"email", "public_profile"},
			Endpoint:     facebook.Endpoint,
		},
		callbackBaseURL:  callbackBaseURL,
		allowedRedirects: allowedRedirects,
		oauthRepo:        oauthRepo,
		userRepo:         userRepo,
		authService:      authService,
	}
}

func (s *oauthService) GenerateState() string {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return base64.URLEncoding.EncodeToString([]byte(fmt.Sprintf("%d", time.Now().UnixNano())))
	}
	return base64.URLEncoding.EncodeToString(b)
}

func (s *oauthService) ValidateRedirectURI(uri string) bool {
	for _, allowed := range s.allowedRedirects {
		if uri == allowed {
			return true
		}
	}
	return false
}

func (s *oauthService) GetAuthURL(provider, state, redirectURI string) (string, error) {
	var config oauth2.Config
	switch provider {
	case models.OAuthProviderGoogle:
		config = *s.googleConfig
		config.RedirectURL = s.callbackBaseURL + "/api/v1/auth/oauth/google/callback"
	case models.OAuthProviderFacebook:
		config = *s.facebookConfig
		config.RedirectURL = s.callbackBaseURL + "/api/v1/auth/oauth/facebook/callback"
	default:
		return "", fmt.Errorf("unknown provider: %s", provider)
	}

	fullState := state + ":" + redirectURI
	return config.AuthCodeURL(fullState, oauth2.AccessTypeOffline), nil
}

func (s *oauthService) HandleCallback(ctx context.Context, provider, code, redirectURI string) (*models.AuthTokens, error) {
	var config oauth2.Config
	switch provider {
	case models.OAuthProviderGoogle:
		config = *s.googleConfig
		config.RedirectURL = s.callbackBaseURL + "/api/v1/auth/oauth/google/callback"
	case models.OAuthProviderFacebook:
		config = *s.facebookConfig
		config.RedirectURL = s.callbackBaseURL + "/api/v1/auth/oauth/facebook/callback"
	default:
		return nil, fmt.Errorf("unknown provider: %s", provider)
	}

	token, err := config.Exchange(ctx, code)
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrOAuthProviderError, err)
	}

	userInfo, err := s.fetchUserInfo(ctx, provider, token)
	if err != nil {
		return nil, err
	}

	return s.findOrCreateUser(ctx, provider, userInfo)
}

func (s *oauthService) fetchUserInfo(ctx context.Context, provider string, token *oauth2.Token) (*OAuthUserInfo, error) {
	client := oauth2.NewClient(ctx, oauth2.StaticTokenSource(token))

	switch provider {
	case models.OAuthProviderGoogle:
		return s.fetchGoogleUserInfo(client)
	case models.OAuthProviderFacebook:
		return s.fetchFacebookUserInfo(client, token.AccessToken)
	default:
		return nil, fmt.Errorf("unknown provider: %s", provider)
	}
}

func (s *oauthService) fetchGoogleUserInfo(client *http.Client) (*OAuthUserInfo, error) {
	resp, err := client.Get("https://www.googleapis.com/oauth2/v2/userinfo")
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	var data struct {
		ID      string `json:"id"`
		Email   string `json:"email"`
		Name    string `json:"name"`
		Picture string `json:"picture"`
	}
	if err := json.Unmarshal(body, &data); err != nil {
		return nil, err
	}

	return &OAuthUserInfo{
		ID:        data.ID,
		Email:     data.Email,
		Name:      data.Name,
		AvatarURL: data.Picture,
	}, nil
}

func (s *oauthService) fetchFacebookUserInfo(client *http.Client, accessToken string) (*OAuthUserInfo, error) {
	url := fmt.Sprintf("https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=%s", accessToken)
	resp, err := client.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	var data struct {
		ID      string `json:"id"`
		Email   string `json:"email"`
		Name    string `json:"name"`
		Picture struct {
			Data struct {
				URL string `json:"url"`
			} `json:"data"`
		} `json:"picture"`
	}
	if err := json.Unmarshal(body, &data); err != nil {
		return nil, err
	}

	return &OAuthUserInfo{
		ID:        data.ID,
		Email:     data.Email,
		Name:      data.Name,
		AvatarURL: data.Picture.Data.URL,
	}, nil
}

func (s *oauthService) findOrCreateUser(ctx context.Context, provider string, info *OAuthUserInfo) (*models.AuthTokens, error) {
	existing, err := s.oauthRepo.FindByProvider(ctx, provider, info.ID)
	if err != nil {
		return nil, err
	}
	if existing != nil {
		user, err := s.userRepo.FindByID(ctx, existing.UserID)
		if err != nil || user == nil {
			return nil, errors.New("linked user not found")
		}
		if user.Role == models.USER_ROLE_ADMIN {
			return nil, ErrOAuthAdminForbidden
		}
		return s.authService.GenerateTokensForUser(ctx, user)
	}

	if info.Email != "" {
		existingUser, err := s.userRepo.FindByEmail(ctx, info.Email)
		if err != nil {
			return nil, err
		}
		if existingUser != nil {
			if existingUser.Role == models.USER_ROLE_ADMIN {
				return nil, ErrOAuthAdminForbidden
			}
			oauth := &models.UserOAuthProvider{
				ID:             uuid.New().String(),
				UserID:         existingUser.ID,
				Provider:       provider,
				ProviderUserID: info.ID,
				Email:          &info.Email,
				Name:           &info.Name,
				AvatarURL:      &info.AvatarURL,
			}
			if err := s.oauthRepo.Create(ctx, oauth); err != nil {
				return nil, err
			}
			return s.authService.GenerateTokensForUser(ctx, existingUser)
		}
	}

	newUser := &models.User{
		ID:       uuid.New().String(),
		Email:    info.Email,
		FullName: info.Name,
		Password: nil,
		Role:     models.USER_ROLE_CUSTOMER,
		Status:   models.USER_STATUS_ACTIVE,
	}
	if info.AvatarURL != "" {
		newUser.Avatar = &info.AvatarURL
	}

	if err := s.userRepo.Create(ctx, newUser); err != nil {
		return nil, err
	}

	oauth := &models.UserOAuthProvider{
		ID:             uuid.New().String(),
		UserID:         newUser.ID,
		Provider:       provider,
		ProviderUserID: info.ID,
		Email:          &info.Email,
		Name:           &info.Name,
		AvatarURL:      &info.AvatarURL,
	}
	if err := s.oauthRepo.Create(ctx, oauth); err != nil {
		return nil, err
	}

	return s.authService.GenerateTokensForUser(ctx, newUser)
}

func (s *oauthService) GetLinkedProviders(ctx context.Context, userID string) ([]models.UserOAuthProvider, error) {
	return s.oauthRepo.FindByUserID(ctx, userID)
}

func (s *oauthService) UnlinkProvider(ctx context.Context, userID, provider string) error {
	user, err := s.userRepo.FindByID(ctx, userID)
	if err != nil || user == nil {
		return errors.New("user not found")
	}

	providers, err := s.oauthRepo.FindByUserID(ctx, userID)
	if err != nil {
		return err
	}

	hasPassword := user.Password != nil && *user.Password != ""
	hasOtherOAuth := false
	for _, p := range providers {
		if p.Provider != provider {
			hasOtherOAuth = true
			break
		}
	}

	if !hasPassword && !hasOtherOAuth {
		return errors.New("cannot unlink last login method")
	}

	return s.oauthRepo.Delete(ctx, userID, provider)
}
