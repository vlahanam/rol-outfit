package services

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/vlahanam/rol-outfit/src/internal/common"
	"github.com/vlahanam/rol-outfit/src/internal/models"
	"github.com/vlahanam/rol-outfit/src/internal/repositories"
	"github.com/vlahanam/rol-outfit/src/internal/requests"
)

var (
	ErrCategoryNotFound  = errors.New("category not found")
	ErrCategorySlugTaken = errors.New("category slug already exists")
)

type CategoryService interface {
	List(ctx context.Context, offset, limit int) ([]*models.Category, int64, error)
	GetByID(ctx context.Context, id string) (*models.Category, error)
	Create(ctx context.Context, req *requests.CreateCategoryRequest) (*models.Category, error)
	Update(ctx context.Context, id string, req *requests.UpdateCategoryRequest) error
	Delete(ctx context.Context, id string) error
}

type categoryService struct {
	repo repositories.CategoryRepository
}

func NewCategoryService(repo repositories.CategoryRepository) CategoryService {
	return &categoryService{repo: repo}
}

func (s *categoryService) List(ctx context.Context, offset, limit int) ([]*models.Category, int64, error) {
	return s.repo.ListCategories(ctx, offset, limit)
}

func (s *categoryService) GetByID(ctx context.Context, id string) (*models.Category, error) {
	c, err := s.repo.FindCategoryByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get category: %w", err)
	}
	if c == nil {
		return nil, ErrCategoryNotFound
	}
	return c, nil
}

func (s *categoryService) Create(ctx context.Context, req *requests.CreateCategoryRequest) (*models.Category, error) {
	slug := common.Slugify(req.Name)
	if slug == "" {
		return nil, ErrCategorySlugTaken
	}

	existing, err := s.repo.FindCategoryBySlug(ctx, slug)
	if err != nil {
		return nil, fmt.Errorf("failed to check slug: %w", err)
	}
	if existing != nil {
		return nil, ErrCategorySlugTaken
	}

	c := &models.Category{
		ID:          uuid.New().String(),
		Name:        req.Name,
		Slug:        slug,
		Description: req.Description,
		Status:      models.CATEGORY_STATUS_ACTIVE,
	}
	if err := s.repo.CreateCategory(ctx, c); err != nil {
		return nil, fmt.Errorf("failed to create category: %w", err)
	}
	return c, nil
}

func (s *categoryService) Update(ctx context.Context, id string, req *requests.UpdateCategoryRequest) error {
	existing, err := s.repo.FindCategoryByID(ctx, id)
	if err != nil {
		return fmt.Errorf("failed to find category: %w", err)
	}
	if existing == nil {
		return ErrCategoryNotFound
	}

	fields := map[string]interface{}{}
	if req.Name != nil {
		newSlug := common.Slugify(*req.Name)
		taken, err := s.repo.FindCategoryBySlug(ctx, newSlug)
		if err != nil {
			return fmt.Errorf("failed to check slug: %w", err)
		}
		if taken != nil && taken.ID != id {
			return ErrCategorySlugTaken
		}
		fields["name"] = *req.Name
		fields["slug"] = newSlug
	}
	if req.Description != nil {
		fields["description"] = *req.Description
	}
	if req.Status != nil {
		fields["status"] = *req.Status
	}

	if len(fields) == 0 {
		return nil
	}
	return s.repo.UpdateCategory(ctx, id, fields)
}

func (s *categoryService) Delete(ctx context.Context, id string) error {
	existing, err := s.repo.FindCategoryByID(ctx, id)
	if err != nil {
		return fmt.Errorf("failed to find category: %w", err)
	}
	if existing == nil {
		return ErrCategoryNotFound
	}
	return s.repo.SoftDeleteCategory(ctx, id)
}
