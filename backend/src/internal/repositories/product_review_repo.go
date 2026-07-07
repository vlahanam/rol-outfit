package repositories

import (
	"context"

	"github.com/vlahanam/rol-outfit/src/internal/models"
	"gorm.io/gorm"
)

type ProductReviewRepository interface {
	CreateReview(ctx context.Context, review *models.ProductReview) error
	GetReviewByID(ctx context.Context, id string) (*models.ProductReview, error)
	GetReviewByUserAndProduct(ctx context.Context, userID, productID string) (*models.ProductReview, error)
	ListReviewsByProduct(ctx context.Context, productID string, status int8, offset, limit int) ([]*models.ProductReview, int, error)
	ListAllReviews(ctx context.Context, status int8, search string, offset, limit int) ([]*models.ProductReview, int, error)
	UpdateReviewStatus(ctx context.Context, id string, status int8) error
	DeleteReview(ctx context.Context, id string) error
	GetReviewStats(ctx context.Context, productID string) (*models.ReviewStats, error)
	UserHasPurchasedProduct(ctx context.Context, userID, productID string) (bool, string, error)
}

func (s *postgreStorage) CreateReview(ctx context.Context, review *models.ProductReview) error {
	return s.db.WithContext(ctx).Create(review).Error
}

func (s *postgreStorage) GetReviewByID(ctx context.Context, id string) (*models.ProductReview, error) {
	var review models.ProductReview
	err := s.db.WithContext(ctx).
		Preload("User").
		Where("id = ?", id).
		First(&review).Error
	if err != nil {
		return nil, err
	}
	return &review, nil
}

func (s *postgreStorage) GetReviewByUserAndProduct(ctx context.Context, userID, productID string) (*models.ProductReview, error) {
	var review models.ProductReview
	err := s.db.WithContext(ctx).
		Where("user_id = ? AND product_id = ?", userID, productID).
		First(&review).Error
	if err != nil {
		return nil, err
	}
	return &review, nil
}

func (s *postgreStorage) ListReviewsByProduct(ctx context.Context, productID string, status int8, offset, limit int) ([]*models.ProductReview, int, error) {
	var reviews []*models.ProductReview
	var total int64

	query := s.db.WithContext(ctx).Model(&models.ProductReview{}).Where("product_id = ?", productID)
	if status > 0 {
		query = query.Where("status = ?", status)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	err := s.db.WithContext(ctx).
		Preload("User").
		Where("product_id = ?", productID).
		Where(func(db *gorm.DB) *gorm.DB {
			if status > 0 {
				return db.Where("status = ?", status)
			}
			return db
		}(s.db)).
		Order("created_at DESC").
		Offset(offset).
		Limit(limit).
		Find(&reviews).Error
	if err != nil {
		return nil, 0, err
	}

	return reviews, int(total), nil
}

func (s *postgreStorage) ListAllReviews(ctx context.Context, status int8, search string, offset, limit int) ([]*models.ProductReview, int, error) {
	var reviews []*models.ProductReview
	var total int64

	query := s.db.WithContext(ctx).Model(&models.ProductReview{})
	if status > 0 {
		query = query.Where("status = ?", status)
	}

	if search != "" {
		query = query.Joins("LEFT JOIN users ON users.id = product_reviews.user_id").
			Joins("LEFT JOIN products ON products.id = product_reviews.product_id").
			Where("users.full_name ILIKE ? OR products.name ILIKE ?", "%"+search+"%", "%"+search+"%")
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	listQuery := s.db.WithContext(ctx).
		Preload("User").
		Preload("Product")
	if status > 0 {
		listQuery = listQuery.Where("status = ?", status)
	}
	if search != "" {
		listQuery = listQuery.Joins("LEFT JOIN users ON users.id = product_reviews.user_id").
			Joins("LEFT JOIN products ON products.id = product_reviews.product_id").
			Where("users.full_name ILIKE ? OR products.name ILIKE ?", "%"+search+"%", "%"+search+"%")
	}

	err := listQuery.
		Order("created_at DESC").
		Offset(offset).
		Limit(limit).
		Find(&reviews).Error
	if err != nil {
		return nil, 0, err
	}

	return reviews, int(total), nil
}

func (s *postgreStorage) UpdateReviewStatus(ctx context.Context, id string, status int8) error {
	return s.db.WithContext(ctx).
		Model(&models.ProductReview{}).
		Where("id = ?", id).
		Update("status", status).Error
}

func (s *postgreStorage) DeleteReview(ctx context.Context, id string) error {
	return s.db.WithContext(ctx).
		Where("id = ?", id).
		Delete(&models.ProductReview{}).Error
}

func (s *postgreStorage) GetReviewStats(ctx context.Context, productID string) (*models.ReviewStats, error) {
	var stats models.ReviewStats
	stats.Distribution = make(map[int]int)

	var result struct {
		AvgRating float64
		Total     int
	}
	err := s.db.WithContext(ctx).
		Model(&models.ProductReview{}).
		Select("COALESCE(AVG(rating), 0) as avg_rating, COUNT(*) as total").
		Where("product_id = ? AND status = ?", productID, models.REVIEW_STATUS_APPROVED).
		Scan(&result).Error
	if err != nil {
		return nil, err
	}

	stats.AverageRating = result.AvgRating
	stats.TotalCount = result.Total

	var distribution []struct {
		Rating int
		Count  int
	}
	err = s.db.WithContext(ctx).
		Model(&models.ProductReview{}).
		Select("rating, COUNT(*) as count").
		Where("product_id = ? AND status = ?", productID, models.REVIEW_STATUS_APPROVED).
		Group("rating").
		Scan(&distribution).Error
	if err != nil {
		return nil, err
	}

	for i := 1; i <= 5; i++ {
		stats.Distribution[i] = 0
	}
	for _, d := range distribution {
		stats.Distribution[d.Rating] = d.Count
	}

	return &stats, nil
}

func (s *postgreStorage) UserHasPurchasedProduct(ctx context.Context, userID, productID string) (bool, string, error) {
	var orderID string
	err := s.db.WithContext(ctx).
		Table("orders").
		Select("orders.id").
		Joins("JOIN order_items ON orders.id = order_items.order_id").
		Where("orders.user_id = ?", userID).
		Where("order_items.product_id = ?", productID).
		Where("orders.status >= ?", models.ORDER_STATUS_COMPLETED).
		Order("orders.created_at DESC").
		Limit(1).
		Scan(&orderID).Error
	if err != nil {
		return false, "", err
	}
	return orderID != "", orderID, nil
}
