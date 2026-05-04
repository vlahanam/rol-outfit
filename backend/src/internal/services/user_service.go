package services

import (
	"context"
	"errors"
	"fmt"

	"github.com/vlahanam/rol-outfit/src/internal/models"
	"github.com/vlahanam/rol-outfit/src/internal/repositories"
	"github.com/vlahanam/rol-outfit/src/internal/requests"
)

var (
	ErrUserNotFound  = errors.New("user not found")
	ErrUserEmailTaken = errors.New("email already taken by another user")
)

type UserService interface {
	List(ctx context.Context, offset, limit int) ([]*models.User, int64, error)
	GetByID(ctx context.Context, id string) (*models.User, error)
	Update(ctx context.Context, id string, req *requests.UpdateUserRequest) error
	UpdateMe(ctx context.Context, id string, req *requests.UpdateMeRequest) error
	Delete(ctx context.Context, id string) error
}

type userService struct {
	repo repositories.UserRepository
}

func NewUserService(repo repositories.UserRepository) UserService {
	return &userService{repo: repo}
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

	fields := map[string]interface{}{}
	if req.FullName != nil {
		fields["full_name"] = *req.FullName
	}
	if req.Email != nil {
		fields["email"] = *req.Email
	}
	if req.Address != nil {
		fields["address"] = *req.Address
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
	return s.repo.Update(ctx, id, fields)
}

func (s *userService) UpdateMe(ctx context.Context, id string, req *requests.UpdateMeRequest) error {
	existing, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return fmt.Errorf("failed to find user: %w", err)
	}
	if existing == nil {
		return ErrUserNotFound
	}

	fields := map[string]interface{}{}
	if req.FullName != nil {
		fields["full_name"] = *req.FullName
	}
	if req.Address != nil {
		fields["address"] = *req.Address
	}
	if req.Phone != nil {
		fields["phone"] = *req.Phone
	}

	if len(fields) == 0 {
		return nil
	}
	return s.repo.Update(ctx, id, fields)
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
