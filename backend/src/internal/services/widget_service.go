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

var ErrWidgetNotFound = errors.New("widget not found")

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
	repo repositories.WidgetRepository
}

func NewWidgetService(repo repositories.WidgetRepository) WidgetService {
	return &widgetService{repo: repo}
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
		Type:         req.Type,
		DisplayOrder: maxOrder + 1,
		Depth:        depth,
		Status:       req.Status,
		Settings:     req.Settings,
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

	if len(fields) == 0 {
		return nil
	}
	return s.repo.UpdateWidget(ctx, id, fields)
}

func (s *widgetService) Delete(ctx context.Context, id string) error {
	existing, err := s.repo.FindWidgetByIDAdmin(ctx, id)
	if err != nil {
		return fmt.Errorf("failed to find widget: %w", err)
	}
	if existing == nil {
		return ErrWidgetNotFound
	}
	return s.repo.DeleteWidget(ctx, id)
}
