package services

import (
	"context"
	"testing"

	"github.com/google/uuid"
	"github.com/vlahanam/rol-outfit/src/internal/models"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("failed to connect to test database: %v", err)
	}

	err = db.AutoMigrate(
		&models.Order{},
		&models.OrderItem{},
		&models.OrderStatusHistory{},
		&models.ProductVariant{},
		&models.Cart{},
		&models.CartItem{},
	)
	if err != nil {
		t.Fatalf("failed to migrate test database: %v", err)
	}

	return db
}

type testRepo struct {
	db *gorm.DB
}

func (r *testRepo) CreateOrder(ctx context.Context, order *models.Order) error {
	return r.db.WithContext(ctx).Create(order).Error
}

func (r *testRepo) FindOrderByID(ctx context.Context, id string) (*models.Order, error) {
	var order models.Order
	err := r.db.WithContext(ctx).Where("id = ?", id).First(&order).Error
	if err == gorm.ErrRecordNotFound {
		return nil, nil
	}
	return &order, err
}

func (r *testRepo) ListOrdersByUser(ctx context.Context, userID string, offset, limit int) ([]*models.Order, int64, error) {
	return nil, 0, nil
}

func (r *testRepo) ListAllOrders(ctx context.Context, status int8, offset, limit int) ([]*models.Order, int64, error) {
	return nil, 0, nil
}

func (r *testRepo) UpdateOrder(ctx context.Context, id string, fields map[string]interface{}) error {
	return r.db.WithContext(ctx).Model(&models.Order{}).Where("id = ?", id).Updates(fields).Error
}

func (r *testRepo) SoftDeleteOrder(ctx context.Context, id string) error {
	return nil
}

func (r *testRepo) CreateOrderItems(ctx context.Context, items []*models.OrderItem) error {
	return r.db.WithContext(ctx).Create(&items).Error
}

func (r *testRepo) ListOrderItems(ctx context.Context, orderID string) ([]*models.OrderItem, error) {
	var items []*models.OrderItem
	err := r.db.WithContext(ctx).Where("order_id = ?", orderID).Find(&items).Error
	return items, err
}

func (r *testRepo) FindOrCreateCart(ctx context.Context, userID string) (*models.Cart, error) {
	var cart models.Cart
	err := r.db.WithContext(ctx).Where("user_id = ?", userID).First(&cart).Error
	if err == gorm.ErrRecordNotFound {
		cart = models.Cart{ID: uuid.New().String(), UserID: userID}
		err = r.db.WithContext(ctx).Create(&cart).Error
	}
	return &cart, err
}

func (r *testRepo) FindCartByUserID(ctx context.Context, userID string) (*models.Cart, error) {
	return nil, nil
}

func (r *testRepo) ListAllCarts(ctx context.Context, offset, limit int, search string) ([]*models.Cart, int64, error) {
	return nil, 0, nil
}

func (r *testRepo) FindCartByID(ctx context.Context, id string) (*models.Cart, error) {
	return nil, nil
}

func (r *testRepo) DeleteCart(ctx context.Context, id string) error {
	return nil
}

func (r *testRepo) CreateCartItem(ctx context.Context, item *models.CartItem) error {
	return nil
}

func (r *testRepo) FindCartItem(ctx context.Context, cartID, productID, attrID string) (*models.CartItem, error) {
	return nil, nil
}

func (r *testRepo) FindCartItemByID(ctx context.Context, id string) (*models.CartItem, error) {
	return nil, nil
}

func (r *testRepo) ListCartItems(ctx context.Context, cartID string) ([]*models.CartItem, error) {
	return nil, nil
}

func (r *testRepo) UpdateCartItem(ctx context.Context, id string, fields map[string]interface{}) error {
	return nil
}

func (r *testRepo) DeleteCartItem(ctx context.Context, id string) error {
	return nil
}

func (r *testRepo) ClearCart(ctx context.Context, cartID string) error {
	return nil
}

func (r *testRepo) CreateStatusHistory(ctx context.Context, history *models.OrderStatusHistory) error {
	return r.db.WithContext(ctx).Create(history).Error
}

func (r *testRepo) ListStatusHistory(ctx context.Context, orderID string) ([]*models.OrderStatusHistory, error) {
	var history []*models.OrderStatusHistory
	err := r.db.WithContext(ctx).Where("order_id = ?", orderID).Find(&history).Error
	return history, err
}
