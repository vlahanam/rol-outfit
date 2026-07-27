package services

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/vlahanam/rol-outfit/src/internal/models"
	"github.com/vlahanam/rol-outfit/src/internal/repositories"
	"github.com/vlahanam/rol-outfit/src/internal/requests"
	"golang.org/x/crypto/bcrypt"
)

var (
	ErrUserNotFound    = errors.New("user not found")
	ErrUserEmailTaken  = errors.New("email already taken by another user")
	ErrUserPhoneTaken  = errors.New("phone already taken by another user")
	ErrInvalidPassword = errors.New("invalid password")
)

type UserService interface {
	Create(ctx context.Context, req *requests.CreateAdminUserRequest) (*models.User, error)
	List(ctx context.Context, offset, limit int) ([]*models.User, int64, error)
	GetByID(ctx context.Context, id string) (*models.User, error)
	Update(ctx context.Context, id string, req *requests.UpdateUserRequest) error
	UpdateMe(ctx context.Context, id string, req *requests.UpdateMeRequest) error
	ChangePassword(ctx context.Context, id string, req *requests.ChangePasswordRequest) error
	Delete(ctx context.Context, id string) error
}

type userService struct {
	repo repositories.UserRepository
}

func NewUserService(repo repositories.UserRepository) UserService {
	return &userService{repo: repo}
}

func (s *userService) Create(ctx context.Context, req *requests.CreateAdminUserRequest) (*models.User, error) {
	existing, err := s.repo.FindByEmail(ctx, req.Email)
	if err != nil {
		return nil, fmt.Errorf("failed to check email: %w", err)
	}
	if existing != nil {
		return nil, ErrUserEmailTaken
	}

	if req.Phone != "" {
		phoneTaken, err := s.repo.FindByPhone(ctx, req.Phone)
		if err != nil {
			return nil, fmt.Errorf("failed to check phone: %w", err)
		}
		if phoneTaken != nil {
			return nil, ErrUserPhoneTaken
		}
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}
	hashStr := string(hash)

	role := models.USER_ROLE_CUSTOMER
	if req.Role != nil {
		role = *req.Role
	}
	status := models.USER_STATUS_ACTIVE
	if req.Status != nil {
		status = *req.Status
	}

	user := &models.User{
		ID:       uuid.New().String(),
		FullName: req.FullName,
		Email:    req.Email,
		Password: &hashStr,
		Phone:    req.Phone,
		Role:     role,
		Status:   status,
	}
	if err := s.repo.Create(ctx, user); err != nil {
		if errors.Is(err, repositories.ErrDuplicateEmail) {
			return nil, ErrUserEmailTaken
		}
		if errors.Is(err, repositories.ErrDuplicatePhone) {
			return nil, ErrUserPhoneTaken
		}
		return nil, fmt.Errorf("failed to create user: %w", err)
	}
	return user, nil
}

func (s *userService) List(ctx context.Context, offset, limit int) ([]*models.User, int64, error) {
	return s.repo.List(ctx, offset, limit)
}

func (s *userService) GetByID(ctx context.Context, id string) (*models.User, error) {
	u, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get user: %w", err)
	}
	if u == nil {
		return nil, ErrUserNotFound
	}
	return u, nil
}

func (s *userService) Update(ctx context.Context, id string, req *requests.UpdateUserRequest) error {
	existing, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return fmt.Errorf("failed to find user: %w", err)
	}
	if existing == nil {
		return ErrUserNotFound
	}

	// Check email uniqueness if changing
	if req.Email != nil && *req.Email != existing.Email {
		taken, err := s.repo.FindByEmail(ctx, *req.Email)
		if err != nil {
			return fmt.Errorf("failed to check email: %w", err)
		}
		if taken != nil {
			return ErrUserEmailTaken
		}
	}

	// Check phone uniqueness if changing
	if req.Phone != nil && *req.Phone != "" && *req.Phone != existing.Phone {
		phoneTaken, err := s.repo.FindByPhone(ctx, *req.Phone)
		if err != nil {
			return fmt.Errorf("failed to check phone: %w", err)
		}
		if phoneTaken != nil {
			return ErrUserPhoneTaken
		}
	}

	fields := map[string]interface{}{}
	if req.FullName != nil {
		fields["full_name"] = *req.FullName
	}
	if req.Email != nil {
		fields["email"] = *req.Email
	}
	if req.Phone != nil {
		fields["phone"] = *req.Phone
	}
	if req.Role != nil {
		fields["role"] = *req.Role
	}
	if req.Status != nil {
		fields["status"] = *req.Status
	}

	if len(fields) == 0 {
		return nil
	}
	if err := s.repo.Update(ctx, id, fields); err != nil {
		if errors.Is(err, repositories.ErrNotFound) {
			return ErrUserNotFound
		}
		if errors.Is(err, repositories.ErrDuplicateEmail) {
			return ErrUserEmailTaken
		}
		if errors.Is(err, repositories.ErrDuplicatePhone) {
			return ErrUserPhoneTaken
		}
		return fmt.Errorf("failed to update user: %w", err)
	}
	return nil
}

func (s *userService) UpdateMe(ctx context.Context, id string, req *requests.UpdateMeRequest) error {
	existing, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return fmt.Errorf("failed to find user: %w", err)
	}
	if existing == nil {
		return ErrUserNotFound
	}

	// Check phone uniqueness if changing
	if req.Phone != nil && *req.Phone != "" && *req.Phone != existing.Phone {
		phoneTaken, err := s.repo.FindByPhone(ctx, *req.Phone)
		if err != nil {
			return fmt.Errorf("failed to check phone: %w", err)
		}
		if phoneTaken != nil {
			return ErrUserPhoneTaken
		}
	}

	fields := map[string]interface{}{}
	if req.FullName != nil {
		fields["full_name"] = *req.FullName
	}
	if req.Phone != nil {
		fields["phone"] = *req.Phone
	}

	if len(fields) == 0 {
		return nil
	}
	return s.repo.Update(ctx, id, fields)
}

func (s *userService) ChangePassword(ctx context.Context, id string, req *requests.ChangePasswordRequest) error {
	existing, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return fmt.Errorf("failed to find user: %w", err)
	}
	if existing == nil {
		return ErrUserNotFound
	}

	// For OAuth users setting password for first time, CurrentPassword can be empty
	if existing.Password != nil && *existing.Password != "" {
		if err := bcrypt.CompareHashAndPassword([]byte(*existing.Password), []byte(req.CurrentPassword)); err != nil {
			return ErrInvalidPassword
		}
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("failed to hash password: %w", err)
	}

	return s.repo.Update(ctx, id, map[string]interface{}{"password": string(hash)})
}

func (s *userService) Delete(ctx context.Context, id string) error {
	existing, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return fmt.Errorf("failed to find user: %w", err)
	}
	if existing == nil {
		return ErrUserNotFound
	}
	return s.repo.SoftDelete(ctx, id)
}
