package services

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/vlahanam/rol-outfit/src/internal/models"
	"github.com/vlahanam/rol-outfit/src/internal/repositories"
	"github.com/vlahanam/rol-outfit/src/internal/requests"
	"golang.org/x/crypto/bcrypt"
)

// Các lỗi nghiệp vụ của auth
var (
	ErrEmailAlreadyExists = errors.New("email already exists")
	ErrPhoneAlreadyExists = errors.New("phone already exists")
	ErrInvalidCredentials = errors.New("invalid email or password")
	ErrUserNotActive      = errors.New("user account is not active")
)

// AuthService định nghĩa các thao tác xác thực
type AuthService interface {
	Register(ctx context.Context, req *requests.RegisterRequest) (*models.AuthTokens, error)
	Login(ctx context.Context, req *requests.LoginRequest) (*models.AuthTokens, error)
}

// authService là implementation của AuthService
type authService struct {
	userRepo  repositories.UserRepository
	jwtSecret string
}

// NewAuthService tạo instance mới của authService
// jwtSecret phải được truyền từ config, không dùng os.Getenv trực tiếp
func NewAuthService(userRepo repositories.UserRepository, jwtSecret string) AuthService {
	return &authService{userRepo: userRepo, jwtSecret: jwtSecret}
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

	// Tạo user mới
	user := &models.User{
		Email:    req.Email,
		Password: string(hashedPassword),
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
	return s.generateTokens(user)
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

	// Kiểm tra password
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		return nil, ErrInvalidCredentials
	}

	// Tạo JWT tokens
	return s.generateTokens(user)
}

// generateTokens tạo access token và refresh token cho user
func (s *authService) generateTokens(user *models.User) (*models.AuthTokens, error) {
	secret := []byte(s.jwtSecret)
	expiresIn := int64(24 * 60 * 60) // 24 giờ tính bằng giây

	// Tạo access token
	accessClaims := jwt.MapClaims{
		"sub":   user.ID,
		"email": user.Email,
		"role":  user.Role,
		"exp":   time.Now().Add(24 * time.Hour).Unix(),
		"iat":   time.Now().Unix(),
	}
	accessToken := jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims)
	accessTokenStr, err := accessToken.SignedString(secret)
	if err != nil {
		return nil, fmt.Errorf("failed to sign access token: %w", err)
	}

	// Tạo refresh token (thời hạn dài hơn)
	refreshClaims := jwt.MapClaims{
		"sub": user.ID,
		"exp": time.Now().Add(7 * 24 * time.Hour).Unix(),
		"iat": time.Now().Unix(),
	}
	refreshToken := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims)
	refreshTokenStr, err := refreshToken.SignedString(secret)
	if err != nil {
		return nil, fmt.Errorf("failed to sign refresh token: %w", err)
	}

	return &models.AuthTokens{
		AccessToken:  accessTokenStr,
		RefreshToken: refreshTokenStr,
		TokenType:    "Bearer",
		ExpiresIn:    expiresIn,
	}, nil
}
