package services

import (
	"context"
	"errors"
	"fmt"
	"log/slog"

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
	List(ctx context.Context, categoryID, search string, tagSlugs []string, sortMode string, productType int8, offset, limit int) ([]*models.Product, int64, error)
	AdminList(ctx context.Context, categoryID, search string, offset, limit int) ([]*models.ProductWithVariants, int64, error)
	GetByID(ctx context.Context, id string) (*models.Product, error)
	AdminGetByID(ctx context.Context, id string) (*models.ProductWithVariants, error)
	Create(ctx context.Context, req *requests.CreateProductRequest) (*models.Product, error)
	Update(ctx context.Context, id string, req *requests.UpdateProductRequest) error
	Delete(ctx context.Context, id string) error
}

type productService struct {
	repo       repositories.ProductRepository
	uploadRepo repositories.UploadRepository
	cleaner    UploadCleaner
}

func NewProductService(repo repositories.ProductRepository, uploadRepo repositories.UploadRepository, cleaner UploadCleaner) ProductService {
	return &productService{repo: repo, uploadRepo: uploadRepo, cleaner: cleaner}
}

func (s *productService) List(ctx context.Context, categoryID, search string, tagSlugs []string, sortMode string, productType int8, offset, limit int) ([]*models.Product, int64, error) {
	products, total, err := s.repo.ListProducts(ctx, categoryID, search, tagSlugs, sortMode, productType, offset, limit)
	if err != nil {
		return nil, 0, err
	}
	if err := s.enrichProducts(ctx, products); err != nil {
		return nil, 0, err
	}
	return products, total, nil
}

func (s *productService) AdminList(ctx context.Context, categoryID, search string, offset, limit int) ([]*models.ProductWithVariants, int64, error) {
	products, total, err := s.repo.ListAdminProductsWithVariants(ctx, categoryID, search, offset, limit)
	if err != nil {
		return nil, 0, err
	}
	if err := s.enrichProductVariants(ctx, products); err != nil {
		return nil, 0, err
	}
	return products, total, nil
}

func (s *productService) GetByID(ctx context.Context, id string) (*models.Product, error) {
	p, err := s.repo.FindProductByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get product: %w", err)
	}
	if p == nil {
		return nil, ErrProductNotFound
	}
	uploads, err := s.uploadRepo.ListUploadsByModel(ctx, "product", id)
	if err != nil {
		return nil, fmt.Errorf("failed to get product uploads: %w", err)
	}
	p.Uploads = uploads
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
	if err := s.enrichSingleProductVariants(ctx, pw); err != nil {
		return nil, err
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

	productType := req.ProductType
	if productType == 0 {
		productType = models.PRODUCT_TYPE_VIETNAMESE
	}

	p := &models.Product{
		ID:              uuid.New().String(),
		CategoryID:      req.CategoryID,
		Name:            req.Name,
		NameJa:          req.NameJa,
		Slug:            slug,
		DefaultPrice:    req.DefaultPrice,
		ShippingCost:    req.ShippingCost,
		Description:     req.Description,
		DescriptionJa:   req.DescriptionJa,
		Status:          models.PRODUCT_STATUS_ACTIVE,
		ProductType:     productType,
		AttributeNames:  models.StringSlice(req.AttributeNames),
		DiscountPercent: req.DiscountPercent,
		DiscountStartAt: req.DiscountStartAt,
		DiscountEndAt:   req.DiscountEndAt,
		SizeGuide:       models.JSONB(req.SizeGuide),
		SizeGuideJa:     models.JSONB(req.SizeGuideJa),
		DeliveryInfo:    models.JSONB(req.DeliveryInfo),
		DeliveryInfoJa:  models.JSONB(req.DeliveryInfoJa),
	}
	if err := s.repo.CreateProduct(ctx, p); err != nil {
		return nil, fmt.Errorf("failed to create product: %w", err)
	}

	if len(req.UploadIDs) > 0 {
		if err := s.uploadRepo.UpdateUploadsModelID(ctx, req.UploadIDs, "product", p.ID); err != nil {
			return nil, fmt.Errorf("failed to link product uploads: %w", err)
		}
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
	if req.ShippingCost != nil {
		fields["shipping_cost"] = *req.ShippingCost
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
	if req.ProductType != nil {
		fields["product_type"] = *req.ProductType
	}
	if req.AttributeNames != nil {
		fields["attribute_names"] = models.StringSlice(req.AttributeNames)
	}
	if req.DiscountPercent != nil {
		fields["discount_percent"] = *req.DiscountPercent
		fields["discount_start_at"] = req.DiscountStartAt
		fields["discount_end_at"] = req.DiscountEndAt
	}
	if len(req.SizeGuide) > 0 {
		fields["size_guide"] = models.JSONB(req.SizeGuide)
	}
	if len(req.SizeGuideJa) > 0 {
		fields["size_guide_ja"] = models.JSONB(req.SizeGuideJa)
	}
	if len(req.DeliveryInfo) > 0 {
		fields["delivery_info"] = models.JSONB(req.DeliveryInfo)
	}
	if len(req.DeliveryInfoJa) > 0 {
		fields["delivery_info_ja"] = models.JSONB(req.DeliveryInfoJa)
	}

	if len(fields) > 0 {
		if err := s.repo.UpdateProduct(ctx, id, fields); err != nil {
			return err
		}
	}

	if req.UploadIDs != nil {
		oldUploads, err := s.uploadRepo.ListUploadsByModel(ctx, "product", id)
		if err != nil {
			return fmt.Errorf("failed to list product uploads: %w", err)
		}
		keep := make(map[string]struct{}, len(req.UploadIDs))
		for _, uid := range req.UploadIDs {
			keep[uid] = struct{}{}
		}
		keepKeys := make([]string, 0, len(oldUploads))
		for _, u := range oldUploads {
			if _, ok := keep[u.ID]; ok {
				keepKeys = append(keepKeys, u.FilePath)
			}
		}
		if err := s.uploadRepo.UpdateUploadsModelID(ctx, req.UploadIDs, "product", id); err != nil {
			return fmt.Errorf("failed to link product uploads: %w", err)
		}
		if err := s.cleaner.DeleteUnusedForModel(ctx, "product", id, keepKeys); err != nil {
			slog.Warn("failed to delete unused product uploads", "product_id", id, "error", err)
		}
	}

	if req.Description != nil || req.DescriptionJa != nil {
		s.cleanupDescriptionUploads(ctx)
	}

	return nil
}

func (s *productService) Delete(ctx context.Context, id string) error {
	existing, err := s.repo.FindProductByIDNoFilter(ctx, id)
	if err != nil {
		return fmt.Errorf("failed to find product: %w", err)
	}
	if existing == nil {
		return ErrProductNotFound
	}

	variantIDs, err := s.repo.ListVariantIDsByProduct(ctx, id)
	if err != nil {
		return fmt.Errorf("failed to list product variants: %w", err)
	}
	for _, variantID := range variantIDs {
		if err := s.cleaner.DeleteUnusedForModel(ctx, "product_variant", variantID, nil); err != nil {
			slog.Warn("failed to delete variant uploads", "variant_id", variantID, "error", err)
		}
	}

	if err := s.repo.SoftDeleteProduct(ctx, id); err != nil {
		return err
	}

	if err := s.cleaner.DeleteUnusedForModel(ctx, "product", id, nil); err != nil {
		slog.Warn("failed to delete product uploads", "product_id", id, "error", err)
	}
	s.cleanupDescriptionUploads(ctx)
	return nil
}

// cleanupDescriptionUploads deletes description uploads whose file is not referenced
// by any product description — runs after descriptions are edited or products are removed.
func (s *productService) cleanupDescriptionUploads(ctx context.Context) {
	products, err := s.repo.ListAllProductDescriptions(ctx)
	if err != nil {
		slog.Warn("failed to list product descriptions", "error", err)
		return
	}
	texts := make([]string, 0, len(products)*2)
	for _, p := range products {
		texts = append(texts, p.Description, p.DescriptionJa)
	}
	keepKeys := s.cleaner.ExtractKeys(texts...)
	if err := s.cleaner.DeleteUnusedForType(ctx, "description", keepKeys); err != nil {
		slog.Warn("failed to clean unused description uploads", "error", err)
	}
}

func (s *productService) enrichProducts(ctx context.Context, products []*models.Product) error {
	if len(products) == 0 {
		return nil
	}
	ids := make([]string, len(products))
	for i, p := range products {
		ids[i] = p.ID
	}
	uploadMap, err := s.uploadRepo.ListUploadsByModels(ctx, "product", ids)
	if err != nil {
		return fmt.Errorf("failed to enrich products with uploads: %w", err)
	}
	for _, p := range products {
		p.Uploads = uploadMap[p.ID]
	}
	return nil
}

func (s *productService) enrichProductVariants(ctx context.Context, products []*models.ProductWithVariants) error {
	if len(products) == 0 {
		return nil
	}
	prodIDs := make([]string, len(products))
	var variantIDs []string
	for i, pw := range products {
		prodIDs[i] = pw.ID
		for _, v := range pw.Variants {
			variantIDs = append(variantIDs, v.ID)
		}
	}
	prodUploadMap, err := s.uploadRepo.ListUploadsByModels(ctx, "product", prodIDs)
	if err != nil {
		return fmt.Errorf("failed to enrich product uploads: %w", err)
	}
	for _, pw := range products {
		pw.Uploads = prodUploadMap[pw.ID]
	}
	if len(variantIDs) > 0 {
		variantUploadMap, err := s.uploadRepo.ListUploadsByModels(ctx, "product_variant", variantIDs)
		if err != nil {
			return fmt.Errorf("failed to enrich variant uploads: %w", err)
		}
		for _, pw := range products {
			for _, v := range pw.Variants {
				v.Uploads = variantUploadMap[v.ID]
			}
		}
	}
	return nil
}

func (s *productService) enrichSingleProductVariants(ctx context.Context, pw *models.ProductWithVariants) error {
	productUploads, err := s.uploadRepo.ListUploadsByModel(ctx, "product", pw.ID)
	if err != nil {
		return fmt.Errorf("failed to get product uploads: %w", err)
	}
	pw.Uploads = productUploads
	if len(pw.Variants) > 0 {
		var variantIDs []string
		for _, v := range pw.Variants {
			variantIDs = append(variantIDs, v.ID)
		}
		variantUploadMap, err := s.uploadRepo.ListUploadsByModels(ctx, "product_variant", variantIDs)
		if err != nil {
			return fmt.Errorf("failed to get variant uploads: %w", err)
		}
		for _, v := range pw.Variants {
			v.Uploads = variantUploadMap[v.ID]
		}
	}
	return nil
}
