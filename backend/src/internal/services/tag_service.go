package services

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/vlahanam/rol-outfit/src/internal/common"
	"github.com/vlahanam/rol-outfit/src/internal/models"
	"github.com/vlahanam/rol-outfit/src/internal/repositories"
	"github.com/vlahanam/rol-outfit/src/internal/requests"
)

var (
	ErrTagNotFound      = errors.New("tag not found")
	ErrTagSlugTaken     = errors.New("tag slug already exists")
	ErrTagInvalidWindow = errors.New("tag end_at must be after start_at")
)

type TagService interface {
	List(ctx context.Context, offset, limit int) ([]*models.Tag, int64, error)
	ListAdmin(ctx context.Context, offset, limit int) ([]*models.Tag, int64, error)
	GetByID(ctx context.Context, id string) (*models.Tag, error)
	GetByIDAdmin(ctx context.Context, id string) (*models.Tag, error)
	Create(ctx context.Context, req *requests.CreateTagRequest) (*models.Tag, error)
	Update(ctx context.Context, id string, req *requests.UpdateTagRequest) error
	Delete(ctx context.Context, id string) error
}

type tagService struct {
	repo repositories.TagRepository
}

func NewTagService(repo repositories.TagRepository) TagService {
	return &tagService{repo: repo}
}

func (s *tagService) List(ctx context.Context, offset, limit int) ([]*models.Tag, int64, error) {
	return s.repo.ListActiveTags(ctx, time.Now(), offset, limit)
}

func (s *tagService) ListAdmin(ctx context.Context, offset, limit int) ([]*models.Tag, int64, error) {
	return s.repo.ListTags(ctx, offset, limit)
}

func (s *tagService) GetByID(ctx context.Context, id string) (*models.Tag, error) {
	t, err := s.repo.FindTagByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get tag: %w", err)
	}
	if t == nil {
		return nil, ErrTagNotFound
	}
	return t, nil
}

func (s *tagService) GetByIDAdmin(ctx context.Context, id string) (*models.Tag, error) {
	t, err := s.repo.FindTagByIDAdmin(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get tag: %w", err)
	}
	if t == nil {
		return nil, ErrTagNotFound
	}
	return t, nil
}

func (s *tagService) Create(ctx context.Context, req *requests.CreateTagRequest) (*models.Tag, error) {
	if req.StartAt != nil && req.EndAt != nil && req.EndAt.Before(*req.StartAt) {
		return nil, ErrTagInvalidWindow
	}

	slug := common.Slugify(req.Name)
	existing, err := s.repo.FindTagBySlug(ctx, slug)
	if err != nil {
		return nil, fmt.Errorf("failed to check slug: %w", err)
	}
	if existing != nil {
		return nil, ErrTagSlugTaken
	}

	t := &models.Tag{
		ID:      uuid.New().String(),
		Name:    req.Name,
		NameJa:  req.NameJa,
		Slug:    slug,
		StartAt: req.StartAt,
		EndAt:   req.EndAt,
	}
	if err := s.repo.CreateTag(ctx, t); err != nil {
		return nil, fmt.Errorf("failed to create tag: %w", err)
	}
	return t, nil
}

func (s *tagService) Update(ctx context.Context, id string, req *requests.UpdateTagRequest) error {
	existing, err := s.repo.FindTagByIDAdmin(ctx, id)
	if err != nil {
		return fmt.Errorf("failed to find tag: %w", err)
	}
	if existing == nil {
		return ErrTagNotFound
	}

	startAt := existing.StartAt
	endAt := existing.EndAt
	if req.StartAt != nil {
		startAt = req.StartAt
	}
	if req.EndAt != nil {
		endAt = req.EndAt
	}
	if startAt != nil && endAt != nil && endAt.Before(*startAt) {
		return ErrTagInvalidWindow
	}

	fields := map[string]interface{}{"updated_at": time.Now()}
	if req.Name != nil {
		newSlug := common.Slugify(*req.Name)
		taken, err := s.repo.FindTagBySlug(ctx, newSlug)
		if err != nil {
			return fmt.Errorf("failed to check slug: %w", err)
		}
		if taken != nil && taken.ID != id {
			return ErrTagSlugTaken
		}
		fields["name"] = *req.Name
		fields["slug"] = newSlug
	}
	if req.NameJa != nil {
		fields["name_ja"] = *req.NameJa
	}
	if req.StartAt != nil {
		fields["start_at"] = req.StartAt
	}
	if req.EndAt != nil {
		fields["end_at"] = req.EndAt
	}

	if err := s.repo.UpdateTag(ctx, id, fields); err != nil {
		if errors.Is(err, repositories.ErrNotFound) {
			return ErrTagNotFound
		}
		return fmt.Errorf("failed to update tag: %w", err)
	}
	return nil
}

func (s *tagService) Delete(ctx context.Context, id string) error {
	existing, err := s.repo.FindTagByIDAdmin(ctx, id)
	if err != nil {
		return fmt.Errorf("failed to find tag: %w", err)
	}
	if existing == nil {
		return ErrTagNotFound
	}
	if err := s.repo.DeleteTag(ctx, id); err != nil {
		if errors.Is(err, repositories.ErrNotFound) {
			return ErrTagNotFound
		}
		return fmt.Errorf("failed to delete tag: %w", err)
	}
	return nil
}
