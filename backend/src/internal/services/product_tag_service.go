package services

import (
	"context"
	"errors"
	"time"

	"github.com/vlahanam/rol-outfit/src/internal/models"
	"github.com/vlahanam/rol-outfit/src/internal/repositories"
)

var (
	ErrTooManyTags     = errors.New("max 3 tags per product")
	ErrTagDoesNotExist = errors.New("one or more tag ids do not exist")
)

type ProductTagService interface {
	Assign(ctx context.Context, productID string, tagIDs []string) error
	GetActiveTags(ctx context.Context, productID string) ([]*models.Tag, error)
	GetAllTags(ctx context.Context, productID string) ([]*models.Tag, error)
}

type productTagService struct {
	repo        repositories.ProductTagRepository
	tagRepo     repositories.TagRepository
	productRepo repositories.ProductRepository
}

func NewProductTagService(
	repo repositories.ProductTagRepository,
	tagRepo repositories.TagRepository,
	productRepo repositories.ProductRepository,
) ProductTagService {
	return &productTagService{repo: repo, tagRepo: tagRepo, productRepo: productRepo}
}

func (s *productTagService) Assign(ctx context.Context, productID string, tagIDs []string) error {
	// dedupe
	seen := make(map[string]struct{}, len(tagIDs))
	unique := tagIDs[:0]
	for _, id := range tagIDs {
		if _, ok := seen[id]; !ok {
			seen[id] = struct{}{}
			unique = append(unique, id)
		}
	}
	tagIDs = unique

	if len(tagIDs) > 3 {
		return ErrTooManyTags
	}

	product, err := s.productRepo.FindProductByIDNoFilter(ctx, productID)
	if err != nil {
		return err
	}
	if product == nil {
		return ErrProductNotFound
	}

	if len(tagIDs) > 0 {
		found, err := s.tagRepo.FindTagsByIDs(ctx, tagIDs)
		if err != nil {
			return err
		}
		if len(found) != len(tagIDs) {
			return ErrTagDoesNotExist
		}
	}

	return s.repo.ReplaceProductTags(ctx, productID, tagIDs)
}

func (s *productTagService) GetActiveTags(ctx context.Context, productID string) ([]*models.Tag, error) {
	return s.repo.FindActiveTagsByProductID(ctx, productID, time.Now())
}

func (s *productTagService) GetAllTags(ctx context.Context, productID string) ([]*models.Tag, error) {
	return s.repo.FindAllTagsByProductID(ctx, productID)
}
