package repositories

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/vlahanam/rol-outfit/src/internal/models"
	"gorm.io/gorm"
)

// OrderRepository defines DB operations for the orders table.
type OrderRepository interface {
	CreateOrder(ctx context.Context, order *models.Order) error
	FindOrderByID(ctx context.Context, id string) (*models.Order, error)
	ListOrdersByUser(ctx context.Context, userID string, offset, limit int) ([]*models.Order, int64, error)
	ListAllOrders(ctx context.Context, status int8, offset, limit int) ([]*models.Order, int64, error)
	UpdateOrder(ctx context.Context, id string, fields map[string]interface{}) error
	SoftDeleteOrder(ctx context.Context, id string) error
}

// OrderItemRepository defines DB operations for the order_item table.
type OrderItemRepository interface {
	CreateOrderItems(ctx context.Context, items []*models.OrderItem) error
	ListOrderItems(ctx context.Context, orderID string) ([]*models.OrderItem, error)
}

func (r *postgreStorage) CreateOrder(ctx context.Context, order *models.Order) error {
	if err := r.db.WithContext(ctx).Create(order).Error; err != nil {
		return fmt.Errorf("failed to create order: %w", err)
	}
	return nil
}

func (r *postgreStorage) FindOrderByID(ctx context.Context, id string) (*models.Order, error) {
	var order models.Order
	err := r.db.WithContext(ctx).
		Where("id = ? AND deleted_at IS NULL", id).
		First(&order).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to find order by id: %w", err)
	}
	return &order, nil
}

func (r *postgreStorage) ListOrdersByUser(ctx context.Context, userID string, offset, limit int) ([]*models.Order, int64, error) {
	var orders []*models.Order
	var total int64

	db := r.db.WithContext(ctx).Model(&models.Order{}).
		Where("user_id = ? AND deleted_at IS NULL", userID)
	if err := db.Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count user orders: %w", err)
	}
	if err := db.Offset(offset).Limit(limit).Order("created_at DESC").Find(&orders).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to list user orders: %w", err)
	}
	return orders, total, nil
}

func (r *postgreStorage) ListAllOrders(ctx context.Context, status int8, offset, limit int) ([]*models.Order, int64, error) {
	var orders []*models.Order
	var total int64

	db := r.db.WithContext(ctx).Model(&models.Order{}).Where("deleted_at IS NULL")
	if status > 0 {
		db = db.Where("status = ?", status)
	}
	if err := db.Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count orders: %w", err)
	}
	if err := db.Offset(offset).Limit(limit).Order("created_at DESC").Find(&orders).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to list orders: %w", err)
	}
	return orders, total, nil
}

func (r *postgreStorage) UpdateOrder(ctx context.Context, id string, fields map[string]interface{}) error {
	result := r.db.WithContext(ctx).
		Model(&models.Order{}).
		Where("id = ? AND deleted_at IS NULL", id).
		Updates(fields)
	if result.Error != nil {
		return fmt.Errorf("failed to update order: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return fmt.Errorf("order not found or already deleted")
	}
	return nil
}

func (r *postgreStorage) SoftDeleteOrder(ctx context.Context, id string) error {
	result := r.db.WithContext(ctx).
		Model(&models.Order{}).
		Where("id = ? AND deleted_at IS NULL", id).
		Update("deleted_at", time.Now())
	if result.Error != nil {
		return fmt.Errorf("failed to soft delete order: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return fmt.Errorf("order not found or already deleted")
	}
	return nil
}

func (r *postgreStorage) CreateOrderItems(ctx context.Context, items []*models.OrderItem) error {
	if err := r.db.WithContext(ctx).Create(&items).Error; err != nil {
		return fmt.Errorf("failed to create order items: %w", err)
	}
	return nil
}

func (r *postgreStorage) ListOrderItems(ctx context.Context, orderID string) ([]*models.OrderItem, error) {
	var items []*models.OrderItem
	if err := r.db.WithContext(ctx).Where("order_id = ?", orderID).Find(&items).Error; err != nil {
		return nil, fmt.Errorf("failed to list order items: %w", err)
	}
	return items, nil
}
