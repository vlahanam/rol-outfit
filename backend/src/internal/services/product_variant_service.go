package services

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/vlahanam/rol-outfit/src/internal/models"
	"github.com/vlahanam/rol-outfit/src/internal/repositories"
	"github.com/vlahanam/rol-outfit/src/internal/requests"
)

var (
	ErrVariantNotFound  = errors.New("variant not found")
	ErrVariantForbidden = errors.New("variant does not belong to product")
)

type ProductVariantService interface {
	List(ctx context.Context, productID string, offset, limit int) ([]*models.ProductVariant, int64, error)
	GetByID(ctx context.Context, productID, id string) (*models.ProductVariant, error)
	Create(ctx context.Context, productID string, req *requests.CreateVariantRequest) (*models.ProductVariant, error)
	Update(ctx context.Context, productID, id string, req *requests.UpdateVariantRequest) error
	Delete(ctx context.Context, productID, id string) error
}

type productVariantService struct {
	repo repositories.ProductVariantRepository
}

func NewProductVariantService(repo repositories.ProductVariantRepository) ProductVariantService {
	return &productVariantService{repo: repo}
}

func (s *productVariantService) List(ctx context.Context, productID string, offset, limit int) ([]*models.ProductVariant, int64, error) {
	return s.repo.ListVariants(ctx, productID, offset, limit)
}

func (s *productVariantService) GetByID(ctx context.Context, productID, id string) (*models.ProductVariant, error) {
	v, err := s.repo.FindVariantByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get variant: %w", err)
	}
	if v == nil {
		return nil, ErrVariantNotFound
	}
	if v.ProductID != productID {
		return nil, ErrVariantForbidden
	}
	return v, nil
}

func (s *productVariantService) Create(ctx context.Context, productID string, req *requests.CreateVariantRequest) (*models.ProductVariant, error) {
	v := &models.ProductVariant{
		ID:         uuid.New().String(),
		ProductID:  productID,
		Attributes: req.Attributes,
		Price:      req.Price,
		Stock:      req.Stock,
		Avatar:     req.Avatar,
		Status:     models.VARIANT_STATUS_ACTIVE,
	}
	if err := s.repo.CreateVariant(ctx, v); err != nil {
		return nil, fmt.Errorf("failed to create variant: %w", err)
	}
	return v, nil
}

func (s *productVariantService) Update(ctx context.Context, productID, id string, req *requests.UpdateVariantRequest) error {
	existing, err := s.repo.FindVariantByID(ctx, id)
	if err != nil {
		return fmt.Errorf("failed to find variant: %w", err)
	}
	if existing == nil {
		return ErrVariantNotFound
	}
	if existing.ProductID != productID {
		return ErrVariantForbidden
	}

	fields := map[string]interface{}{}
	if len(req.Attributes) > 0 {
		fields["attributes"] = req.Attributes
	}
	if req.Price != nil {
		fields["price"] = *req.Price
	}
	if req.Stock != nil {
		fields["stock"] = *req.Stock
	}
	if req.Avatar != nil {
		fields["avatar"] = *req.Avatar
	}
	if req.Status != nil {
		fields["status"] = *req.Status
	}

	if len(fields) == 0 {
		return nil
	}
	return s.repo.UpdateVariant(ctx, id, fields)
}

func (s *productVariantService) Delete(ctx context.Context, productID, id string) error {
	existing, err := s.repo.FindVariantByID(ctx, id)
	if err != nil {
		return fmt.Errorf("failed to find variant: %w", err)
	}
	if existing == nil {
		return ErrVariantNotFound
	}
	if existing.ProductID != productID {
		return ErrVariantForbidden
	}
	return s.repo.DeleteVariant(ctx, id)
}
