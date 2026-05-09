package services

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/vlahanam/rol-outfit/src/internal/models"
	"github.com/vlahanam/rol-outfit/src/internal/repositories"
	"github.com/vlahanam/rol-outfit/src/internal/requests"
)

var (
	ErrVariantNotFound           = errors.New("variant not found")
	ErrVariantForbidden          = errors.New("variant does not belong to product")
	ErrVariantAttributesMismatch = errors.New("variant attributes do not match product attribute_names")
)

type ProductVariantService interface {
	List(ctx context.Context, productID string, offset, limit int) ([]*models.ProductVariant, int64, error)
	GetByID(ctx context.Context, productID, id string) (*models.ProductVariant, error)
	Create(ctx context.Context, productID string, req *requests.CreateVariantRequest) (*models.ProductVariant, error)
	Update(ctx context.Context, productID, id string, req *requests.UpdateVariantRequest) error
	Delete(ctx context.Context, productID, id string) error
}

type productVariantService struct {
	repo     repositories.ProductVariantRepository
	prodRepo repositories.ProductRepository
}

func NewProductVariantService(repo repositories.ProductVariantRepository, prodRepo repositories.ProductRepository) ProductVariantService {
	return &productVariantService{repo: repo, prodRepo: prodRepo}
}

// validateAttributes ensures raw JSON keys match product's attribute_names exactly.
func validateAttributes(raw json.RawMessage, attrNames models.StringSlice) error {
	if len(attrNames) == 0 {
		return nil
	}
	var attrs map[string]interface{}
	if err := json.Unmarshal(raw, &attrs); err != nil {
		return ErrVariantAttributesMismatch
	}
	expected := make(map[string]struct{}, len(attrNames))
	for _, k := range attrNames {
		expected[k] = struct{}{}
	}
	if len(attrs) != len(expected) {
		return ErrVariantAttributesMismatch
	}
	for k := range expected {
		if _, ok := attrs[k]; !ok {
			return ErrVariantAttributesMismatch
		}
	}
	return nil
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
	product, err := s.prodRepo.FindProductByIDNoFilter(ctx, productID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch product: %w", err)
	}
	if product == nil {
		return nil, ErrVariantNotFound
	}
	if err := validateAttributes(req.Attributes, product.AttributeNames); err != nil {
		return nil, err
	}

	v := &models.ProductVariant{
		ID:              uuid.New().String(),
		ProductID:       productID,
		Attributes:      req.Attributes,
		Price:           req.Price,
		Stock:           req.Stock,
		Avatar:          req.Avatar,
		Status:          models.VARIANT_STATUS_ACTIVE,
		DiscountPercent: req.DiscountPercent,
		DiscountStartAt: req.DiscountStartAt,
		DiscountEndAt:   req.DiscountEndAt,
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
		product, err := s.prodRepo.FindProductByIDNoFilter(ctx, productID)
		if err != nil {
			return fmt.Errorf("failed to fetch product: %w", err)
		}
		if product == nil {
			return ErrVariantForbidden
		}
		if err := validateAttributes(req.Attributes, product.AttributeNames); err != nil {
			return err
		}
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
	if req.DiscountPercent != nil {
		fields["discount_percent"] = *req.DiscountPercent
		fields["discount_start_at"] = req.DiscountStartAt
		fields["discount_end_at"] = req.DiscountEndAt
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
