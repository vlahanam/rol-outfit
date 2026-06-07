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
	ErrProductNotFound  = errors.New("product not found")
	ErrProductSlugTaken = errors.New("product slug already exists")
)

type ProductService interface {
	List(ctx context.Context, categoryID, search string, tagSlugs []string, sortMode string, offset, limit int) ([]*models.Product, int64, error)
	AdminList(ctx context.Context, categoryID, search string, offset, limit int) ([]*models.ProductWithVariants, int64, error)
	GetByID(ctx context.Context, id string) (*models.Product, error)
	AdminGetByID(ctx context.Context, id string) (*models.ProductWithVariants, error)
	Create(ctx context.Context, req *requests.CreateProductRequest) (*models.Product, error)
	Update(ctx context.Context, id string, req *requests.UpdateProductRequest) error
	Delete(ctx context.Context, id string) error
}

type productService struct {
	repo repositories.ProductRepository
}

func NewProductService(repo repositories.ProductRepository) ProductService {
	return &productService{repo: repo}
}

func (s *productService) List(ctx context.Context, categoryID, search string, tagSlugs []string, sortMode string, offset, limit int) ([]*models.Product, int64, error) {
	return s.repo.ListProducts(ctx, categoryID, search, tagSlugs, sortMode, offset, limit)
}

func (s *productService) AdminList(ctx context.Context, categoryID, search string, offset, limit int) ([]*models.ProductWithVariants, int64, error) {
	return s.repo.ListAdminProductsWithVariants(ctx, categoryID, search, offset, limit)
}

func (s *productService) GetByID(ctx context.Context, id string) (*models.Product, error) {
	p, err := s.repo.FindProductByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get product: %w", err)
	}
	if p == nil {
		return nil, ErrProductNotFound
	}
	return p, nil
}

func (s *productService) AdminGetByID(ctx context.Context, id string) (*models.ProductWithVariants, error) {
	pw, err := s.repo.FindProductByIDAdmin(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get admin product: %w", err)
	}
	if pw == nil {
		return nil, ErrProductNotFound
	}
	return pw, nil
}

func (s *productService) Create(ctx context.Context, req *requests.CreateProductRequest) (*models.Product, error) {
	slug := common.Slugify(req.Name)
	if slug == "" {
		return nil, ErrProductSlugTaken
	}

	existing, err := s.repo.FindProductBySlug(ctx, slug)
	if err != nil {
		return nil, fmt.Errorf("failed to check slug: %w", err)
	}
	if existing != nil {
		return nil, ErrProductSlugTaken
	}

	p := &models.Product{
		ID:              uuid.New().String(),
		CategoryID:      req.CategoryID,
		Name:            req.Name,
		NameJa:          req.NameJa,
		Slug:            slug,
		DefaultPrice:    req.DefaultPrice,
		Description:     req.Description,
		DescriptionJa:   req.DescriptionJa,
		Avatar:          req.Avatar,
		Status:          models.PRODUCT_STATUS_ACTIVE,
		AttributeNames:  models.StringSlice(req.AttributeNames),
		DiscountPercent: req.DiscountPercent,
		DiscountStartAt: req.DiscountStartAt,
		DiscountEndAt:   req.DiscountEndAt,
	}
	if err := s.repo.CreateProduct(ctx, p); err != nil {
		return nil, fmt.Errorf("failed to create product: %w", err)
	}
	return p, nil
}

func (s *productService) Update(ctx context.Context, id string, req *requests.UpdateProductRequest) error {
	existing, err := s.repo.FindProductByIDNoFilter(ctx, id)
	if err != nil {
		return fmt.Errorf("failed to find product: %w", err)
	}
	if existing == nil {
		return ErrProductNotFound
	}

	fields := map[string]interface{}{}
	if req.Name != nil {
		newSlug := common.Slugify(*req.Name)
		taken, err := s.repo.FindProductBySlug(ctx, newSlug)
		if err != nil {
			return fmt.Errorf("failed to check slug: %w", err)
		}
		if taken != nil && taken.ID != id {
			return ErrProductSlugTaken
		}
		fields["name"] = *req.Name
		fields["slug"] = newSlug
	}
	if req.CategoryID != nil {
		fields["category_id"] = *req.CategoryID
	}
	if req.DefaultPrice != nil {
		fields["default_price"] = *req.DefaultPrice
	}
	if req.Description != nil {
		fields["description"] = *req.Description
	}
	if req.DescriptionJa != nil {
		fields["description_ja"] = *req.DescriptionJa
	}
	if req.NameJa != nil {
		fields["name_ja"] = *req.NameJa
	}
	if req.Status != nil {
		fields["status"] = *req.Status
	}
	if req.AttributeNames != nil {
		fields["attribute_names"] = models.StringSlice(req.AttributeNames)
	}
	if req.Avatar != nil {
		fields["avatar"] = *req.Avatar
	}
	if req.DiscountPercent != nil {
		fields["discount_percent"] = *req.DiscountPercent
		fields["discount_start_at"] = req.DiscountStartAt
		fields["discount_end_at"] = req.DiscountEndAt
	}

	if len(fields) == 0 {
		return nil
	}
	return s.repo.UpdateProduct(ctx, id, fields)
}

func (s *productService) Delete(ctx context.Context, id string) error {
	existing, err := s.repo.FindProductByIDNoFilter(ctx, id)
	if err != nil {
		return fmt.Errorf("failed to find product: %w", err)
	}
	if existing == nil {
		return ErrProductNotFound
	}
	return s.repo.SoftDeleteProduct(ctx, id)
}
