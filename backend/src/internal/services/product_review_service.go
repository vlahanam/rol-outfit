package services

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/vlahanam/rol-outfit/src/internal/models"
	"github.com/vlahanam/rol-outfit/src/internal/repositories"
	"gorm.io/gorm"
)

var (
	ErrReviewNotFound  = errors.New("review not found")
	ErrAlreadyReviewed = errors.New("user already reviewed this product")
	ErrInvalidRating   = errors.New("rating must be between 1 and 5")
)

type CreateReviewRequest struct {
	Rating  int8   `json:"rating"`
	Comment string `json:"comment"`
}

type ProductReviewService interface {
	Create(ctx context.Context, userID, productID string, req *CreateReviewRequest) (*models.ProductReview, error)
	ListByProduct(ctx context.Context, productID string, page, limit int) ([]*models.ProductReview, int, error)
	ListAll(ctx context.Context, status int8, search string, page, limit int) ([]*models.ProductReview, int, error)
	GetStats(ctx context.Context, productID string) (*models.ReviewStats, error)
	Approve(ctx context.Context, id string) error
	Reject(ctx context.Context, id string) error
	Delete(ctx context.Context, id string) error
	CanUserReview(ctx context.Context, userID, productID string) (bool, string, error)
}

type productReviewService struct {
	repo repositories.ProductReviewRepository
}

func NewProductReviewService(repo repositories.ProductReviewRepository) ProductReviewService {
	return &productReviewService{repo: repo}
}

func (s *productReviewService) Create(ctx context.Context, userID, productID string, req *CreateReviewRequest) (*models.ProductReview, error) {
	if req.Rating < 1 || req.Rating > 5 {
		return nil, ErrInvalidRating
	}

	existing, err := s.repo.GetReviewByUserAndProduct(ctx, userID, productID)
	if err == nil && existing != nil {
		return nil, ErrAlreadyReviewed
	}
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}

	review := &models.ProductReview{
		ID:        uuid.New().String(),
		ProductID: productID,
		UserID:    userID,
		Rating:    req.Rating,
		Comment:   req.Comment,
		Status:    models.REVIEW_STATUS_PENDING,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if err := s.repo.CreateReview(ctx, review); err != nil {
		return nil, err
	}

	return review, nil
}

func (s *productReviewService) ListByProduct(ctx context.Context, productID string, page, limit int) ([]*models.ProductReview, int, error) {
	offset := (page - 1) * limit
	return s.repo.ListReviewsByProduct(ctx, productID, models.REVIEW_STATUS_APPROVED, offset, limit)
}

func (s *productReviewService) ListAll(ctx context.Context, status int8, search string, page, limit int) ([]*models.ProductReview, int, error) {
	offset := (page - 1) * limit
	return s.repo.ListAllReviews(ctx, status, search, offset, limit)
}

func (s *productReviewService) GetStats(ctx context.Context, productID string) (*models.ReviewStats, error) {
	return s.repo.GetReviewStats(ctx, productID)
}

func (s *productReviewService) Approve(ctx context.Context, id string) error {
	_, err := s.repo.GetReviewByID(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrReviewNotFound
		}
		return err
	}
	return s.repo.UpdateReviewStatus(ctx, id, models.REVIEW_STATUS_APPROVED)
}

func (s *productReviewService) Reject(ctx context.Context, id string) error {
	_, err := s.repo.GetReviewByID(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrReviewNotFound
		}
		return err
	}
	return s.repo.UpdateReviewStatus(ctx, id, models.REVIEW_STATUS_REJECTED)
}

func (s *productReviewService) Delete(ctx context.Context, id string) error {
	_, err := s.repo.GetReviewByID(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrReviewNotFound
		}
		return err
	}
	return s.repo.DeleteReview(ctx, id)
}

func (s *productReviewService) CanUserReview(ctx context.Context, userID, productID string) (bool, string, error) {
	existing, err := s.repo.GetReviewByUserAndProduct(ctx, userID, productID)
	if err == nil && existing != nil {
		return false, "already_reviewed", nil
	}
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return false, "", err
	}

	return true, "", nil
}
