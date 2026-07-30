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
	repo       repositories.ProductVariantRepository
	prodRepo   repositories.ProductRepository
	uploadRepo repositories.UploadRepository
}

func NewProductVariantService(repo repositories.ProductVariantRepository, prodRepo repositories.ProductRepository, uploadRepo repositories.UploadRepository) ProductVariantService {
	return &productVariantService{repo: repo, prodRepo: prodRepo, uploadRepo: uploadRepo}
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
	variants, total, err := s.repo.ListVariants(ctx, productID, offset, limit)
	if err != nil {
		return nil, 0, err
	}
	if err := s.enrichVariants(ctx, variants); err != nil {
		return nil, 0, err
	}
	return variants, total, nil
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
	uploads, err := s.uploadRepo.ListUploadsByModel(ctx, "product_variant", id)
	if err != nil {
		return nil, fmt.Errorf("failed to get variant uploads: %w", err)
	}
	v.Uploads = uploads
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
		Name:            req.Name,
		NameJa:          req.NameJa,
		Attributes:      req.Attributes,
		Price:           req.Price,
		Stock:           req.Stock,
		Status:          models.VARIANT_STATUS_ACTIVE,
		DiscountPercent: req.DiscountPercent,
		DiscountStartAt: req.DiscountStartAt,
		DiscountEndAt:   req.DiscountEndAt,
	}
	if err := s.repo.CreateVariant(ctx, v); err != nil {
		return nil, fmt.Errorf("failed to create variant: %w", err)
	}

	if len(req.UploadIDs) > 0 {
		if err := s.uploadRepo.UpdateUploadsModelID(ctx, req.UploadIDs, "product_variant", v.ID); err != nil {
			return nil, fmt.Errorf("failed to link variant uploads: %w", err)
		}
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
	if req.Name != nil {
		fields["name"] = *req.Name
	}
	if req.NameJa != nil {
		fields["name_ja"] = *req.NameJa
	}
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
	if req.Status != nil {
		fields["status"] = *req.Status
	}
	if req.DiscountPercent != nil {
		fields["discount_percent"] = *req.DiscountPercent
		fields["discount_start_at"] = req.DiscountStartAt
		fields["discount_end_at"] = req.DiscountEndAt
	}

	if len(fields) > 0 {
		if err := s.repo.UpdateVariant(ctx, id, fields); err != nil {
			return err
		}
	}

	if len(req.UploadIDs) > 0 {
		oldUploads, err := s.uploadRepo.ListUploadsByModel(ctx, "product_variant", id)
		if err == nil {
			oldIDs := make([]string, 0, len(oldUploads))
			for _, u := range oldUploads {
				oldIDs = append(oldIDs, u.ID)
			}
			_ = s.uploadRepo.ClearUploadsModelID(ctx, oldIDs)
		}
		if err := s.uploadRepo.UpdateUploadsModelID(ctx, req.UploadIDs, "product_variant", id); err != nil {
			return fmt.Errorf("failed to link variant uploads: %w", err)
		}
	}

	return nil
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

func (s *productVariantService) enrichVariants(ctx context.Context, variants []*models.ProductVariant) error {
	if len(variants) == 0 {
		return nil
	}
	ids := make([]string, len(variants))
	for i, v := range variants {
		ids[i] = v.ID
	}
	uploadMap, err := s.uploadRepo.ListUploadsByModels(ctx, "product_variant", ids)
	if err != nil {
		return fmt.Errorf("failed to enrich variants with uploads: %w", err)
	}
	for _, v := range variants {
		v.Uploads = uploadMap[v.ID]
	}
	return nil
}
