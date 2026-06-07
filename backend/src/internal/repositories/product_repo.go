package repositories

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/vlahanam/rol-outfit/src/internal/models"
	"gorm.io/gorm"
)

// ProductRepository defines DB operations for the products table.
type ProductRepository interface {
	CreateProduct(ctx context.Context, p *models.Product) error
	FindProductByID(ctx context.Context, id string) (*models.Product, error)
	FindProductByIDNoFilter(ctx context.Context, id string) (*models.Product, error)
	FindProductByIDAdmin(ctx context.Context, id string) (*models.ProductWithVariants, error)
	FindProductBySlug(ctx context.Context, slug string) (*models.Product, error)
	ListProducts(ctx context.Context, categoryID, search string, tagSlugs []string, sortMode string, offset, limit int) ([]*models.Product, int64, error)
	UpdateProduct(ctx context.Context, id string, fields map[string]interface{}) error
	SoftDeleteProduct(ctx context.Context, id string) error
	ListAdminProductsWithVariants(ctx context.Context, categoryID, search string, offset, limit int) ([]*models.ProductWithVariants, int64, error)
}

func (r *postgreStorage) CreateProduct(ctx context.Context, p *models.Product) error {
	if err := r.db.WithContext(ctx).Create(p).Error; err != nil {
		return fmt.Errorf("failed to create product: %w", err)
	}
	return nil
}

func (r *postgreStorage) FindProductByID(ctx context.Context, id string) (*models.Product, error) {
	var p models.Product
	err := r.db.WithContext(ctx).
		Where("id = ? AND deleted_at IS NULL AND status = ?", id, models.PRODUCT_STATUS_ACTIVE).
		First(&p).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to find product by id: %w", err)
	}
	return &p, nil
}

func (r *postgreStorage) FindProductBySlug(ctx context.Context, slug string) (*models.Product, error) {
	var p models.Product
	err := r.db.WithContext(ctx).
		Where("slug = ? AND deleted_at IS NULL", slug).
		First(&p).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to find product by slug: %w", err)
	}
	return &p, nil
}

func (r *postgreStorage) ListProducts(ctx context.Context, categoryID, search string, tagSlugs []string, sortMode string, offset, limit int) ([]*models.Product, int64, error) {
	var products []*models.Product
	var total int64
	now := time.Now()

	db := r.db.WithContext(ctx).Model(&models.Product{}).
		Where("products.deleted_at IS NULL AND products.status = ?", models.PRODUCT_STATUS_ACTIVE)

	if categoryID != "" {
		db = db.Where("products.category_id = ?", categoryID)
	}
	if search != "" {
		db = db.Where("products.name ILIKE ?", "%"+search+"%")
	}

	if sortMode == "new_arrivals" && len(tagSlugs) > 0 {
		db = db.
			Joins("LEFT JOIN product_tags ON product_tags.product_id = products.id").
			Joins("LEFT JOIN tags ON tags.id = product_tags.tag_id AND tags.slug IN ? AND (tags.start_at IS NULL OR tags.start_at <= ?) AND (tags.end_at IS NULL OR tags.end_at >= ?)", tagSlugs, now, now).
			Group("products.id")
	} else if len(tagSlugs) > 0 {
		db = db.
			Joins("JOIN product_tags ON product_tags.product_id = products.id").
			Joins("JOIN tags ON tags.id = product_tags.tag_id").
			Where("tags.slug IN ?", tagSlugs).
			Where("(tags.start_at IS NULL OR tags.start_at <= ?) AND (tags.end_at IS NULL OR tags.end_at >= ?)", now, now).
			Group("products.id")
	}

	if err := db.Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count products: %w", err)
	}

	orderClause := "products.created_at DESC"
	if sortMode == "new_arrivals" && len(tagSlugs) > 0 {
		orderClause = `CASE
			WHEN COUNT(tags.id) > 0 AND products.discount_percent > 0
				AND (products.discount_start_at IS NULL OR products.discount_start_at <= NOW())
				AND (products.discount_end_at IS NULL OR products.discount_end_at >= NOW()) THEN 0
			WHEN COUNT(tags.id) > 0 THEN 1
			WHEN products.discount_percent > 0
				AND (products.discount_start_at IS NULL OR products.discount_start_at <= NOW())
				AND (products.discount_end_at IS NULL OR products.discount_end_at >= NOW()) THEN 2
			ELSE 3
		END, products.created_at DESC`
	}

	if err := db.Offset(offset).Limit(limit).Order(orderClause).Find(&products).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to list products: %w", err)
	}

	if len(products) > 0 {
		var ids []string
		for _, p := range products {
			ids = append(ids, p.ID)
		}
		now := time.Now()
		type productTagRow struct {
			ProductID string     `gorm:"column:product_id"`
			TagID     string     `gorm:"column:id"`
			Name      string     `gorm:"column:name"`
			NameJa    string     `gorm:"column:name_ja"`
			Slug      string     `gorm:"column:slug"`
			StartAt   *time.Time `gorm:"column:start_at"`
			EndAt     *time.Time `gorm:"column:end_at"`
			CreatedAt time.Time  `gorm:"column:created_at"`
			UpdatedAt time.Time  `gorm:"column:updated_at"`
		}
		var rows []productTagRow
		if err := r.db.WithContext(ctx).
			Table("product_tags").
			Select("product_tags.product_id, tags.id, tags.name, tags.name_ja, tags.slug, tags.start_at, tags.end_at, tags.created_at, tags.updated_at").
			Joins("JOIN tags ON tags.id = product_tags.tag_id").
			Where("product_tags.product_id IN ?", ids).
			Where("(tags.start_at IS NULL OR tags.start_at <= ?) AND (tags.end_at IS NULL OR tags.end_at >= ?)", now, now).
			Scan(&rows).Error; err == nil {
			tagMap := make(map[string][]models.Tag)
			for _, r := range rows {
				tagMap[r.ProductID] = append(tagMap[r.ProductID], models.Tag{
					ID:        r.TagID,
					Name:      r.Name,
					NameJa:    r.NameJa,
					Slug:      r.Slug,
					StartAt:   r.StartAt,
					EndAt:     r.EndAt,
					CreatedAt: r.CreatedAt,
					UpdatedAt: r.UpdatedAt,
				})
			}
			for _, p := range products {
				p.Tags = tagMap[p.ID]
			}
		}
	}

	return products, total, nil
}

func (r *postgreStorage) UpdateProduct(ctx context.Context, id string, fields map[string]interface{}) error {
	result := r.db.WithContext(ctx).
		Model(&models.Product{}).
		Where("id = ? AND deleted_at IS NULL", id).
		Updates(fields)
	if result.Error != nil {
		return fmt.Errorf("failed to update product: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return fmt.Errorf("product not found or already deleted")
	}
	return nil
}

func (r *postgreStorage) SoftDeleteProduct(ctx context.Context, id string) error {
	result := r.db.WithContext(ctx).
		Model(&models.Product{}).
		Where("id = ? AND deleted_at IS NULL", id).
		Update("deleted_at", time.Now())
	if result.Error != nil {
		return fmt.Errorf("failed to soft delete product: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return fmt.Errorf("product not found or already deleted")
	}
	return nil
}

// FindProductByIDNoFilter fetches a product by ID ignoring status — used internally (e.g. variant validation).
func (r *postgreStorage) FindProductByIDNoFilter(ctx context.Context, id string) (*models.Product, error) {
	var p models.Product
	err := r.db.WithContext(ctx).
		Where("id = ? AND deleted_at IS NULL", id).
		First(&p).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to find product (no filter): %w", err)
	}
	return &p, nil
}

// FindProductByIDAdmin fetches a non-deleted product with all its variants — for admin detail view.
func (r *postgreStorage) FindProductByIDAdmin(ctx context.Context, id string) (*models.ProductWithVariants, error) {
	var p models.Product
	err := r.db.WithContext(ctx).
		Where("id = ? AND deleted_at IS NULL", id).
		First(&p).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to find product (admin): %w", err)
	}

	var variants []*models.ProductVariant
	if err := r.db.WithContext(ctx).
		Where("product_id = ?", id).
		Order("created_at ASC").
		Find(&variants).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch variants for admin product: %w", err)
	}
	return &models.ProductWithVariants{Product: &p, Variants: variants}, nil
}

// ListAdminProductsWithVariants fetches all non-deleted products (any status) with their variants.
// It supports optional filtering by category_id and name search.
func (r *postgreStorage) ListAdminProductsWithVariants(ctx context.Context, categoryID, search string, offset, limit int) ([]*models.ProductWithVariants, int64, error) {
	var products []*models.Product
	var total int64

	q := r.db.WithContext(ctx).Model(&models.Product{}).Where("deleted_at IS NULL")
	if categoryID != "" {
		q = q.Where("category_id = ?", categoryID)
	}
	if search != "" {
		q = q.Where("name ILIKE ?", "%"+search+"%")
	}
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count admin products: %w", err)
	}
	if err := q.Offset(offset).Limit(limit).Order("created_at DESC").Find(&products).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to list admin products: %w", err)
	}
	if len(products) == 0 {
		return []*models.ProductWithVariants{}, 0, nil
	}

	ids := make([]string, len(products))
	for i, p := range products {
		ids[i] = p.ID
	}

	var variants []*models.ProductVariant
	if err := r.db.WithContext(ctx).
		Where("product_id IN ?", ids).
		Order("created_at ASC").
		Find(&variants).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to fetch variants for admin products: %w", err)
	}

	variantMap := make(map[string][]*models.ProductVariant, len(products))
	for _, v := range variants {
		variantMap[v.ProductID] = append(variantMap[v.ProductID], v)
	}

	result := make([]*models.ProductWithVariants, len(products))
	for i, p := range products {
		result[i] = &models.ProductWithVariants{
			Product:  p,
			Variants: variantMap[p.ID],
		}
	}
	return result, total, nil
}
