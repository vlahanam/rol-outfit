package services

import (
	"context"
	"errors"
	"fmt"
	"log/slog"

	"github.com/google/uuid"
	"github.com/vlahanam/rol-outfit/src/internal/models"
	"github.com/vlahanam/rol-outfit/src/internal/repositories"
	"github.com/vlahanam/rol-outfit/src/internal/requests"
)

var ErrWidgetNotFound = errors.New("widget not found")

// widgetUploadTypes are the upload model types whose files may be referenced by widget settings.
var widgetUploadTypes = []string{
	"banner-slider", "trend-hot", "collection-grid", "new-product",
}

type WidgetService interface {
	List(ctx context.Context, parentID *string, offset, limit int) ([]*models.Widget, int64, error)
	ListAdmin(ctx context.Context, parentID *string, offset, limit int) ([]*models.Widget, int64, error)
	GetByID(ctx context.Context, id string) (*models.Widget, error)
	GetByIDAdmin(ctx context.Context, id string) (*models.Widget, error)
	Create(ctx context.Context, req *requests.CreateWidgetRequest) (*models.Widget, error)
	Update(ctx context.Context, id string, req *requests.UpdateWidgetRequest) error
	Delete(ctx context.Context, id string) error
}

type widgetService struct {
	repo    repositories.WidgetRepository
	cleaner UploadCleaner
}

func NewWidgetService(repo repositories.WidgetRepository, cleaner UploadCleaner) WidgetService {
	return &widgetService{repo: repo, cleaner: cleaner}
}

func (s *widgetService) List(ctx context.Context, parentID *string, offset, limit int) ([]*models.Widget, int64, error) {
	return s.repo.ListWidgets(ctx, parentID, offset, limit)
}

func (s *widgetService) ListAdmin(ctx context.Context, parentID *string, offset, limit int) ([]*models.Widget, int64, error) {
	return s.repo.ListWidgetsAdmin(ctx, parentID, offset, limit)
}

func (s *widgetService) GetByID(ctx context.Context, id string) (*models.Widget, error) {
	w, err := s.repo.FindWidgetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get widget: %w", err)
	}
	if w == nil {
		return nil, ErrWidgetNotFound
	}
	return w, nil
}

func (s *widgetService) GetByIDAdmin(ctx context.Context, id string) (*models.Widget, error) {
	w, err := s.repo.FindWidgetByIDAdmin(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get widget (admin): %w", err)
	}
	if w == nil {
		return nil, ErrWidgetNotFound
	}
	return w, nil
}

func (s *widgetService) Create(ctx context.Context, req *requests.CreateWidgetRequest) (*models.Widget, error) {
	depth := 0
	if req.ParentID != nil {
		parent, err := s.repo.FindWidgetByIDAdmin(ctx, *req.ParentID)
		if err != nil {
			return nil, fmt.Errorf("failed to check parent widget: %w", err)
		}
		if parent == nil {
			return nil, ErrWidgetNotFound
		}
		depth = parent.Depth + 1
	}

	maxOrder, err := s.repo.MaxWidgetDisplayOrder(ctx, req.ParentID)
	if err != nil {
		return nil, fmt.Errorf("failed to get max display order: %w", err)
	}

	w := &models.Widget{
		ID:           uuid.New().String(),
		ParentID:     req.ParentID,
		Name:         req.Name,
		NameJa:       req.NameJa,
		Type:         req.Type,
		DisplayOrder: maxOrder + 1,
		Depth:        depth,
		Status:       req.Status,
		Settings:     req.Settings,
		Metadata:     req.Metadata,
	}
	if err := s.repo.CreateWidget(ctx, w); err != nil {
		return nil, fmt.Errorf("failed to create widget: %w", err)
	}
	return w, nil
}

func (s *widgetService) Update(ctx context.Context, id string, req *requests.UpdateWidgetRequest) error {
	existing, err := s.repo.FindWidgetByIDAdmin(ctx, id)
	if err != nil {
		return fmt.Errorf("failed to find widget: %w", err)
	}
	if existing == nil {
		return ErrWidgetNotFound
	}

	fields := map[string]interface{}{}
	if req.Name != nil {
		fields["name"] = *req.Name
	}
	if req.NameJa != nil {
		fields["name_ja"] = *req.NameJa
	}
	if req.Type != nil {
		fields["type"] = *req.Type
	}
	if req.DisplayOrder != nil {
		fields["display_order"] = *req.DisplayOrder
	}
	if req.Status != nil {
		fields["status"] = *req.Status
	}
	if req.Settings != nil {
		fields["settings"] = req.Settings
	}
	if req.Metadata != nil {
		fields["metadata"] = req.Metadata
	}

	if len(fields) == 0 {
		return nil
	}
	if err := s.repo.UpdateWidget(ctx, id, fields); err != nil {
		return err
	}
	if req.Settings != nil {
		s.reconcileImages(ctx)
	}
	return nil
}

func (s *widgetService) Delete(ctx context.Context, id string) error {
	existing, err := s.repo.FindWidgetByIDAdmin(ctx, id)
	if err != nil {
		return fmt.Errorf("failed to find widget: %w", err)
	}
	if existing == nil {
		return ErrWidgetNotFound
	}
	if err := s.repo.DeleteWidget(ctx, id); err != nil {
		return err
	}
	s.reconcileImages(ctx)
	return nil
}

// reconcileImages deletes widget image uploads whose files are not referenced by any widget settings/metadata.
func (s *widgetService) reconcileImages(ctx context.Context) {
	widgets, err := s.repo.ListAllWidgets(ctx)
	if err != nil {
		slog.Warn("failed to list widgets for image cleanup", "error", err)
		return
	}
	texts := make([]string, 0, len(widgets)*2)
	for _, w := range widgets {
		texts = append(texts, string(w.Settings), string(w.Metadata))
	}
	keepKeys := s.cleaner.ExtractKeys(texts...)
	for _, t := range widgetUploadTypes {
		if err := s.cleaner.DeleteUnusedForType(ctx, t, keepKeys); err != nil {
			slog.Warn("failed to clean unused widget uploads", "type", t, "error", err)
		}
	}
}
