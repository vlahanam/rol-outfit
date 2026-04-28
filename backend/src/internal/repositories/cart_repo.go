package repositories

import (
	"context"
	"errors"
	"fmt"

	"github.com/vlahanam/rol-outfit/src/internal/models"
	"gorm.io/gorm"
)

// CartRepository defines DB operations for the carts table.
type CartRepository interface {
	FindOrCreateCart(ctx context.Context, userID string) (*models.Cart, error)
	FindCartByUserID(ctx context.Context, userID string) (*models.Cart, error)
}

// CartItemRepository defines DB operations for the cart_item table.
type CartItemRepository interface {
	CreateCartItem(ctx context.Context, item *models.CartItem) error
	FindCartItem(ctx context.Context, cartID, productID, attrID string) (*models.CartItem, error)
	FindCartItemByID(ctx context.Context, id string) (*models.CartItem, error)
	ListCartItems(ctx context.Context, cartID string) ([]*models.CartItem, error)
	UpdateCartItem(ctx context.Context, id string, fields map[string]interface{}) error
	DeleteCartItem(ctx context.Context, id string) error
	ClearCart(ctx context.Context, cartID string) error
}

func (r *postgreStorage) FindOrCreateCart(ctx context.Context, userID string) (*models.Cart, error) {
	var cart models.Cart
	err := r.db.WithContext(ctx).
		Where(models.Cart{UserID: userID}).
		FirstOrCreate(&cart).Error
	if err != nil {
		return nil, fmt.Errorf("failed to find or create cart: %w", err)
	}
	return &cart, nil
}

func (r *postgreStorage) FindCartByUserID(ctx context.Context, userID string) (*models.Cart, error) {
	var cart models.Cart
	err := r.db.WithContext(ctx).
		Where("user_id = ?", userID).
		First(&cart).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to find cart by user id: %w", err)
	}
	return &cart, nil
}

func (r *postgreStorage) CreateCartItem(ctx context.Context, item *models.CartItem) error {
	if err := r.db.WithContext(ctx).Create(item).Error; err != nil {
		return fmt.Errorf("failed to create cart item: %w", err)
	}
	return nil
}

func (r *postgreStorage) FindCartItem(ctx context.Context, cartID, productID, attrID string) (*models.CartItem, error) {
	var item models.CartItem
	q := r.db.WithContext(ctx).Where("cart_id = ? AND product_id = ?", cartID, productID)
	if attrID != "" {
		q = q.Where("attr_id = ?", attrID)
	} else {
		q = q.Where("attr_id IS NULL OR attr_id = ''")
	}
	err := q.First(&item).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to find cart item: %w", err)
	}
	return &item, nil
}

func (r *postgreStorage) FindCartItemByID(ctx context.Context, id string) (*models.CartItem, error) {
	var item models.CartItem
	err := r.db.WithContext(ctx).Where("id = ?", id).First(&item).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to find cart item by id: %w", err)
	}
	return &item, nil
}

func (r *postgreStorage) ListCartItems(ctx context.Context, cartID string) ([]*models.CartItem, error) {
	var items []*models.CartItem
	if err := r.db.WithContext(ctx).Where("cart_id = ?", cartID).Find(&items).Error; err != nil {
		return nil, fmt.Errorf("failed to list cart items: %w", err)
	}
	return items, nil
}

func (r *postgreStorage) UpdateCartItem(ctx context.Context, id string, fields map[string]interface{}) error {
	result := r.db.WithContext(ctx).
		Model(&models.CartItem{}).
		Where("id = ?", id).
		Updates(fields)
	if result.Error != nil {
		return fmt.Errorf("failed to update cart item: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return fmt.Errorf("cart item not found")
	}
	return nil
}

func (r *postgreStorage) DeleteCartItem(ctx context.Context, id string) error {
	result := r.db.WithContext(ctx).Where("id = ?", id).Delete(&models.CartItem{})
	if result.Error != nil {
		return fmt.Errorf("failed to delete cart item: %w", result.Error)
	}
	return nil
}

func (r *postgreStorage) ClearCart(ctx context.Context, cartID string) error {
	if err := r.db.WithContext(ctx).Where("cart_id = ?", cartID).Delete(&models.CartItem{}).Error; err != nil {
		return fmt.Errorf("failed to clear cart: %w", err)
	}
	return nil
}
