package services

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/vlahanam/rol-outfit/src/internal/models"
	"github.com/vlahanam/rol-outfit/src/internal/repositories"
	"github.com/vlahanam/rol-outfit/src/internal/requests"
	"golang.org/x/crypto/bcrypt"
)

// TTL constants for token expiry
const (
	accessTokenTTL  = 15 * time.Minute
	refreshTokenTTL = 7 * 24 * time.Hour
)

// Các lỗi nghiệp vụ của auth
var (
	ErrEmailAlreadyExists  = errors.New("email already exists")
	ErrPhoneAlreadyExists  = errors.New("phone already exists")
	ErrInvalidCredentials  = errors.New("invalid email or password")
	ErrUserNotActive       = errors.New("user account is not active")
	ErrRefreshTokenInvalid = errors.New("refresh token invalid")
	ErrTokenFamilyRevoked  = errors.New("token family revoked")
)

// AuthService định nghĩa các thao tác xác thực
type AuthService interface {
	Register(ctx context.Context, req *requests.RegisterRequest) (*models.AuthTokens, error)
	Login(ctx context.Context, req *requests.LoginRequest) (*models.AuthTokens, error)
	Refresh(ctx context.Context, refreshToken string) (*models.AuthTokens, error)
	Logout(ctx context.Context, refreshToken string) error
	GenerateTokensForUser(ctx context.Context, user *models.User) (*models.AuthTokens, error)
}

// authService là implementation của AuthService
type authService struct {
	userRepo         repositories.UserRepository
	refreshTokenRepo repositories.RefreshTokenRepository
	jwtSecret        string
}

// NewAuthService tạo instance mới của authService
// jwtSecret phải được truyền từ config, không dùng os.Getenv trực tiếp
func NewAuthService(userRepo repositories.UserRepository, refreshTokenRepo repositories.RefreshTokenRepository, jwtSecret string) AuthService {
	return &authService{
		userRepo:         userRepo,
		refreshTokenRepo: refreshTokenRepo,
		jwtSecret:        jwtSecret,
	}
}

// Register xử lý đăng ký tài khoản mới
func (s *authService) Register(ctx context.Context, req *requests.RegisterRequest) (*models.AuthTokens, error) {
	// Kiểm tra email đã tồn tại chưa
	existing, err := s.userRepo.FindByEmail(ctx, req.Email)
	if err != nil {
		return nil, fmt.Errorf("failed to check existing email: %w", err)
	}
	if existing != nil {
		return nil, ErrEmailAlreadyExists
	}

	// Kiểm tra phone đã tồn tại chưa
	if req.Phone != "" {
		phoneTaken, err := s.userRepo.FindByPhone(ctx, req.Phone)
		if err != nil {
			return nil, fmt.Errorf("failed to check existing phone: %w", err)
		}
		if phoneTaken != nil {
			return nil, ErrPhoneAlreadyExists
		}
	}

	// Hash password trước khi lưu vào database
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}
	hashedPasswordStr := string(hashedPassword)

	// Tạo user mới
	user := &models.User{
		ID:       uuid.New().String(),
		Email:    req.Email,
		Password: &hashedPasswordStr,
		Role:     models.USER_ROLE_CUSTOMER,
		FullName: req.FullName,
		Phone:    req.Phone,
	}

	if err := s.userRepo.Create(ctx, user); err != nil {
		if errors.Is(err, repositories.ErrDuplicatePhone) {
			return nil, ErrPhoneAlreadyExists
		}
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	// Tạo JWT tokens sau khi đăng ký thành công
	return s.generateTokens(ctx, user, nil)
}

// Login xử lý đăng nhập
func (s *authService) Login(ctx context.Context, req *requests.LoginRequest) (*models.AuthTokens, error) {
	// Tìm user theo email
	user, err := s.userRepo.FindByEmail(ctx, req.Email)
	if err != nil {
		return nil, fmt.Errorf("failed to find user: %w", err)
	}
	if user == nil {
		return nil, ErrInvalidCredentials
	}

	// Kiểm tra password (OAuth-only users have nil password)
	if user.Password == nil {
		return nil, ErrInvalidCredentials
	}
	if err := bcrypt.CompareHashAndPassword([]byte(*user.Password), []byte(req.Password)); err != nil {
		return nil, ErrInvalidCredentials
	}

	// Tạo JWT tokens
	return s.generateTokens(ctx, user, nil)
}

// generateTokens tạo access token và refresh token cho user.
// familyID nil means new login (new family); non-nil means rotation (reuse family).
func (s *authService) generateTokens(ctx context.Context, user *models.User, familyID *string) (*models.AuthTokens, error) {
	secret := []byte(s.jwtSecret)

	jti := uuid.New().String()

	// Determine token family
	family := jti
	if familyID != nil {
		family = *familyID
	}

	// Tạo access token
	accessClaims := jwt.MapClaims{
		"sub":   user.ID,
		"email": user.Email,
		"role":  user.Role,
		"exp":   time.Now().Add(accessTokenTTL).Unix(),
		"iat":   time.Now().Unix(),
	}
	accessToken := jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims)
	accessTokenStr, err := accessToken.SignedString(secret)
	if err != nil {
		return nil, fmt.Errorf("failed to sign access token: %w", err)
	}

	// Tạo refresh token với jti và family_id
	refreshClaims := jwt.MapClaims{
		"sub":       user.ID,
		"jti":       jti,
		"family_id": family,
		"exp":       time.Now().Add(refreshTokenTTL).Unix(),
		"iat":       time.Now().Unix(),
	}
	refreshToken := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims)
	refreshTokenStr, err := refreshToken.SignedString(secret)
	if err != nil {
		return nil, fmt.Errorf("failed to sign refresh token: %w", err)
	}

	// Hash refresh token before persisting (hashToken defined in auth_service_refresh.go)
	tokenHash := hashToken(refreshTokenStr)

	// Persist refresh token record
	dbToken := &models.RefreshToken{
		ID:          uuid.New().String(),
		UserID:      user.ID,
		TokenHash:   tokenHash,
		TokenFamily: family,
		ExpiresAt:   time.Now().Add(refreshTokenTTL),
	}
	if err := s.refreshTokenRepo.SaveRefreshToken(ctx, dbToken); err != nil {
		return nil, fmt.Errorf("failed to persist refresh token: %w", err)
	}

	return &models.AuthTokens{
		AccessToken:  accessTokenStr,
		RefreshToken: refreshTokenStr,
		TokenType:    "Bearer",
		ExpiresIn:    int64(accessTokenTTL.Seconds()),
	}, nil
}

// GenerateTokensForUser creates tokens for a user (used by OAuth)
func (s *authService) GenerateTokensForUser(ctx context.Context, user *models.User) (*models.AuthTokens, error) {
	return s.generateTokens(ctx, user, nil)
}
