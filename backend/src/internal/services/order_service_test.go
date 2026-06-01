package services

import (
	"context"
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/vlahanam/rol-outfit/src/internal/models"
	"github.com/vlahanam/rol-outfit/src/internal/requests"
)

// MockOrderRepository is a mock implementation of OrderRepository
type MockOrderRepository struct {
	mock.Mock
}

func (m *MockOrderRepository) CreateOrder(ctx context.Context, order *models.Order) error {
	args := m.Called(ctx, order)
	return args.Error(0)
}

func (m *MockOrderRepository) FindOrderByID(ctx context.Context, id string) (*models.Order, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Order), args.Error(1)
}

func (m *MockOrderRepository) ListOrdersByUser(ctx context.Context, userID string, offset, limit int) ([]*models.Order, int64, error) {
	args := m.Called(ctx, userID, offset, limit)
	if args.Get(0) == nil {
		return nil, 0, args.Error(2)
	}
	return args.Get(0).([]*models.Order), args.Get(1).(int64), args.Error(2)
}

func (m *MockOrderRepository) ListAllOrders(ctx context.Context, status int8, offset, limit int) ([]*models.Order, int64, error) {
	args := m.Called(ctx, status, offset, limit)
	if args.Get(0) == nil {
		return nil, 0, args.Error(2)
	}
	return args.Get(0).([]*models.Order), args.Get(1).(int64), args.Error(2)
}

func (m *MockOrderRepository) UpdateOrder(ctx context.Context, id string, fields map[string]interface{}) error {
	args := m.Called(ctx, id, fields)
	return args.Error(0)
}

func (m *MockOrderRepository) SoftDeleteOrder(ctx context.Context, id string) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

// MockOrderItemRepository is a mock implementation of OrderItemRepository
type MockOrderItemRepository struct {
	mock.Mock
}

func (m *MockOrderItemRepository) CreateOrderItems(ctx context.Context, items []*models.OrderItem) error {
	args := m.Called(ctx, items)
	return args.Error(0)
}

func (m *MockOrderItemRepository) ListOrderItems(ctx context.Context, orderID string) ([]*models.OrderItem, error) {
	args := m.Called(ctx, orderID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.OrderItem), args.Error(1)
}

// MockCartRepository is a mock implementation of CartRepository
type MockCartRepository struct {
	mock.Mock
}

func (m *MockCartRepository) FindOrCreateCart(ctx context.Context, userID string) (*models.Cart, error) {
	args := m.Called(ctx, userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Cart), args.Error(1)
}

func (m *MockCartRepository) FindCartByUserID(ctx context.Context, userID string) (*models.Cart, error) {
	args := m.Called(ctx, userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Cart), args.Error(1)
}

func (m *MockCartRepository) ListAllCarts(ctx context.Context, offset, limit int, search string) ([]*models.Cart, int64, error) {
	args := m.Called(ctx, offset, limit, search)
	if args.Get(0) == nil {
		return nil, 0, args.Error(2)
	}
	return args.Get(0).([]*models.Cart), args.Get(1).(int64), args.Error(2)
}

func (m *MockCartRepository) FindCartByID(ctx context.Context, id string) (*models.Cart, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Cart), args.Error(1)
}

func (m *MockCartRepository) DeleteCart(ctx context.Context, id string) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

// MockCartItemRepository is a mock implementation of CartItemRepository
type MockCartItemRepository struct {
	mock.Mock
}

func (m *MockCartItemRepository) CreateCartItem(ctx context.Context, item *models.CartItem) error {
	args := m.Called(ctx, item)
	return args.Error(0)
}

func (m *MockCartItemRepository) FindCartItem(ctx context.Context, cartID, productID, attrID string) (*models.CartItem, error) {
	args := m.Called(ctx, cartID, productID, attrID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.CartItem), args.Error(1)
}

func (m *MockCartItemRepository) FindCartItemByID(ctx context.Context, id string) (*models.CartItem, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.CartItem), args.Error(1)
}

func (m *MockCartItemRepository) ListCartItems(ctx context.Context, cartID string) ([]*models.CartItem, error) {
	args := m.Called(ctx, cartID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.CartItem), args.Error(1)
}

func (m *MockCartItemRepository) UpdateCartItem(ctx context.Context, id string, fields map[string]interface{}) error {
	args := m.Called(ctx, id, fields)
	return args.Error(0)
}

func (m *MockCartItemRepository) DeleteCartItem(ctx context.Context, id string) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockCartItemRepository) ClearCart(ctx context.Context, cartID string) error {
	args := m.Called(ctx, cartID)
	return args.Error(0)
}

// Test UpdateShippingInfo - Success case: Update pending order
func TestUpdateShippingInfo_Success(t *testing.T) {
	ctx := context.Background()
	userID := uuid.New().String()
	orderID := uuid.New().String()

	order := &models.Order{
		ID:              orderID,
		UserID:          userID,
		Status:          models.ORDER_STATUS_PENDING,
		ShippingAddress: "Old Address",
		Phone:           "1234567890",
	}

	newAddress := "New Address"
	newPhone := "9876543210"
	req := &requests.UpdateOrderShippingRequest{
		ShippingAddress: &newAddress,
		Phone:           &newPhone,
	}

	mockOrderRepo := new(MockOrderRepository)
	mockOrderItemRepo := new(MockOrderItemRepository)
	mockCartRepo := new(MockCartRepository)
	mockCartItemRepo := new(MockCartItemRepository)

	// Setup expectations
	mockOrderRepo.On("FindOrderByID", ctx, orderID).Return(order, nil)
	mockOrderRepo.On("UpdateOrder", ctx, orderID, mock.MatchedBy(func(fields map[string]interface{}) bool {
		return fields["shipping_address"] == newAddress && fields["phone"] == newPhone
	})).Return(nil)

	svc := NewOrderService(nil, mockOrderRepo, mockOrderItemRepo, mockCartRepo, mockCartItemRepo)

	// Execute
	err := svc.UpdateShippingInfo(ctx, userID, orderID, req)

	// Assert
	assert.NoError(t, err)
	mockOrderRepo.AssertExpectations(t)
}

// Test UpdateShippingInfo - Fail: Non-pending order
func TestUpdateShippingInfo_NonPendingOrder(t *testing.T) {
	ctx := context.Background()
	userID := uuid.New().String()
	orderID := uuid.New().String()

	order := &models.Order{
		ID:     orderID,
		UserID: userID,
		Status: models.ORDER_STATUS_CONFIRMED,
	}

	newAddress := "New Address"
	req := &requests.UpdateOrderShippingRequest{
		ShippingAddress: &newAddress,
	}

	mockOrderRepo := new(MockOrderRepository)
	mockOrderItemRepo := new(MockOrderItemRepository)
	mockCartRepo := new(MockCartRepository)
	mockCartItemRepo := new(MockCartItemRepository)

	mockOrderRepo.On("FindOrderByID", ctx, orderID).Return(order, nil)

	svc := NewOrderService(nil, mockOrderRepo, mockOrderItemRepo, mockCartRepo, mockCartItemRepo)

	// Execute
	err := svc.UpdateShippingInfo(ctx, userID, orderID, req)

	// Assert
	assert.Error(t, err)
	assert.Equal(t, ErrCannotUpdateShipping, err)
	mockOrderRepo.AssertNotCalled(t, "UpdateOrder")
}

// Test UpdateShippingInfo - Fail: Order not found
func TestUpdateShippingInfo_OrderNotFound(t *testing.T) {
	ctx := context.Background()
	userID := uuid.New().String()
	orderID := uuid.New().String()

	newAddress := "New Address"
	req := &requests.UpdateOrderShippingRequest{
		ShippingAddress: &newAddress,
	}

	mockOrderRepo := new(MockOrderRepository)
	mockOrderItemRepo := new(MockOrderItemRepository)
	mockCartRepo := new(MockCartRepository)
	mockCartItemRepo := new(MockCartItemRepository)

	mockOrderRepo.On("FindOrderByID", ctx, orderID).Return(nil, nil)

	svc := NewOrderService(nil, mockOrderRepo, mockOrderItemRepo, mockCartRepo, mockCartItemRepo)

	// Execute
	err := svc.UpdateShippingInfo(ctx, userID, orderID, req)

	// Assert
	assert.Error(t, err)
	assert.Equal(t, ErrOrderNotFound, err)
}

// Test UpdateShippingInfo - Fail: Order not owned by user
func TestUpdateShippingInfo_OrderNotOwned(t *testing.T) {
	ctx := context.Background()
	userID := uuid.New().String()
	otherUserID := uuid.New().String()
	orderID := uuid.New().String()

	order := &models.Order{
		ID:     orderID,
		UserID: otherUserID,
		Status: models.ORDER_STATUS_PENDING,
	}

	newAddress := "New Address"
	req := &requests.UpdateOrderShippingRequest{
		ShippingAddress: &newAddress,
	}

	mockOrderRepo := new(MockOrderRepository)
	mockOrderItemRepo := new(MockOrderItemRepository)
	mockCartRepo := new(MockCartRepository)
	mockCartItemRepo := new(MockCartItemRepository)

	mockOrderRepo.On("FindOrderByID", ctx, orderID).Return(order, nil)

	svc := NewOrderService(nil, mockOrderRepo, mockOrderItemRepo, mockCartRepo, mockCartItemRepo)

	// Execute
	err := svc.UpdateShippingInfo(ctx, userID, orderID, req)

	// Assert
	assert.Error(t, err)
	assert.Equal(t, ErrOrderNotOwned, err)
}

// Test UpdateShippingInfo - Partial update: Only phone
func TestUpdateShippingInfo_PartialUpdate_OnlyPhone(t *testing.T) {
	ctx := context.Background()
	userID := uuid.New().String()
	orderID := uuid.New().String()

	order := &models.Order{
		ID:     orderID,
		UserID: userID,
		Status: models.ORDER_STATUS_PENDING,
	}

	newPhone := "9876543210"
	req := &requests.UpdateOrderShippingRequest{
		Phone: &newPhone,
	}

	mockOrderRepo := new(MockOrderRepository)
	mockOrderItemRepo := new(MockOrderItemRepository)
	mockCartRepo := new(MockCartRepository)
	mockCartItemRepo := new(MockCartItemRepository)

	mockOrderRepo.On("FindOrderByID", ctx, orderID).Return(order, nil)
	mockOrderRepo.On("UpdateOrder", ctx, orderID, mock.MatchedBy(func(fields map[string]interface{}) bool {
		_, hasPhone := fields["phone"]
		_, hasAddress := fields["shipping_address"]
		_, hasNote := fields["note"]
		return hasPhone && !hasAddress && !hasNote
	})).Return(nil)

	svc := NewOrderService(nil, mockOrderRepo, mockOrderItemRepo, mockCartRepo, mockCartItemRepo)

	// Execute
	err := svc.UpdateShippingInfo(ctx, userID, orderID, req)

	// Assert
	assert.NoError(t, err)
	mockOrderRepo.AssertExpectations(t)
}

// Test UpdateShippingInfo - Empty request (no fields to update)
func TestUpdateShippingInfo_EmptyRequest(t *testing.T) {
	ctx := context.Background()
	userID := uuid.New().String()
	orderID := uuid.New().String()

	order := &models.Order{
		ID:     orderID,
		UserID: userID,
		Status: models.ORDER_STATUS_PENDING,
	}

	req := &requests.UpdateOrderShippingRequest{}

	mockOrderRepo := new(MockOrderRepository)
	mockOrderItemRepo := new(MockOrderItemRepository)
	mockCartRepo := new(MockCartRepository)
	mockCartItemRepo := new(MockCartItemRepository)

	mockOrderRepo.On("FindOrderByID", ctx, orderID).Return(order, nil)
	// UpdateOrder should not be called when no fields are provided

	svc := NewOrderService(nil, mockOrderRepo, mockOrderItemRepo, mockCartRepo, mockCartItemRepo)

	// Execute
	err := svc.UpdateShippingInfo(ctx, userID, orderID, req)

	// Assert
	assert.NoError(t, err)
	mockOrderRepo.AssertNotCalled(t, "UpdateOrder")
}

// Test UpdateShippingInfo with all statuses
func TestUpdateShippingInfo_AllStatuses(t *testing.T) {
	ctx := context.Background()
	userID := uuid.New().String()
	orderID := uuid.New().String()

	statuses := []struct {
		status      int8
		shouldAllow bool
	}{
		{models.ORDER_STATUS_PENDING, true},
		{models.ORDER_STATUS_CONFIRMED, false},
		{models.ORDER_STATUS_SHIPPING, false},
		{models.ORDER_STATUS_DELIVERED, false},
		{models.ORDER_STATUS_PAID, false},
		{models.ORDER_STATUS_CANCELLED, false},
	}

	newAddress := "New Address"
	req := &requests.UpdateOrderShippingRequest{
		ShippingAddress: &newAddress,
	}

	for _, tc := range statuses {
		t.Run("Status_"+string(rune(tc.status)), func(t *testing.T) {
			order := &models.Order{
				ID:     orderID,
				UserID: userID,
				Status: tc.status,
			}

			mockOrderRepo := new(MockOrderRepository)
			mockOrderItemRepo := new(MockOrderItemRepository)
			mockCartRepo := new(MockCartRepository)
			mockCartItemRepo := new(MockCartItemRepository)

			mockOrderRepo.On("FindOrderByID", ctx, orderID).Return(order, nil)
			if tc.shouldAllow {
				mockOrderRepo.On("UpdateOrder", ctx, orderID, mock.Anything).Return(nil)
			}

			svc := NewOrderService(nil, mockOrderRepo, mockOrderItemRepo, mockCartRepo, mockCartItemRepo)

			// Execute
			err := svc.UpdateShippingInfo(ctx, userID, orderID, req)

			// Assert
			if tc.shouldAllow {
				assert.NoError(t, err)
				mockOrderRepo.AssertCalled(t, "UpdateOrder", ctx, orderID, mock.Anything)
			} else {
				assert.Error(t, err)
				assert.Equal(t, ErrCannotUpdateShipping, err)
				mockOrderRepo.AssertNotCalled(t, "UpdateOrder")
			}
		})
	}
}

// Test UpdateStatus
func TestUpdateStatus(t *testing.T) {
	ctx := context.Background()
	orderID := uuid.New().String()

	order := &models.Order{
		ID:     orderID,
		Status: models.ORDER_STATUS_PENDING,
	}

	mockOrderRepo := new(MockOrderRepository)
	mockOrderItemRepo := new(MockOrderItemRepository)
	mockCartRepo := new(MockCartRepository)
	mockCartItemRepo := new(MockCartItemRepository)

	mockOrderRepo.On("FindOrderByID", ctx, orderID).Return(order, nil)
	mockOrderRepo.On("UpdateOrder", ctx, orderID, map[string]interface{}{"status": models.ORDER_STATUS_CONFIRMED}).Return(nil)

	svc := NewOrderService(nil, mockOrderRepo, mockOrderItemRepo, mockCartRepo, mockCartItemRepo)

	// Execute
	err := svc.UpdateStatus(ctx, orderID, models.ORDER_STATUS_CONFIRMED)

	// Assert
	assert.NoError(t, err)
	mockOrderRepo.AssertExpectations(t)
}

// Test CancelOrder - Success
func TestCancelOrder_Success(t *testing.T) {
	ctx := context.Background()
	userID := uuid.New().String()
	orderID := uuid.New().String()

	order := &models.Order{
		ID:     orderID,
		UserID: userID,
		Status: models.ORDER_STATUS_PENDING,
	}

	mockOrderRepo := new(MockOrderRepository)
	mockOrderItemRepo := new(MockOrderItemRepository)
	mockCartRepo := new(MockCartRepository)
	mockCartItemRepo := new(MockCartItemRepository)

	mockOrderRepo.On("FindOrderByID", ctx, orderID).Return(order, nil)
	mockOrderRepo.On("UpdateOrder", ctx, orderID, map[string]interface{}{"status": models.ORDER_STATUS_CANCELLED}).Return(nil)

	svc := NewOrderService(nil, mockOrderRepo, mockOrderItemRepo, mockCartRepo, mockCartItemRepo)

	// Execute
	err := svc.CancelOrder(ctx, userID, orderID)

	// Assert
	assert.NoError(t, err)
	mockOrderRepo.AssertExpectations(t)
}

// Test CancelOrder - Fail: Non-pending order
func TestCancelOrder_NonPendingOrder(t *testing.T) {
	ctx := context.Background()
	userID := uuid.New().String()
	orderID := uuid.New().String()

	order := &models.Order{
		ID:     orderID,
		UserID: userID,
		Status: models.ORDER_STATUS_CONFIRMED,
	}

	mockOrderRepo := new(MockOrderRepository)
	mockOrderItemRepo := new(MockOrderItemRepository)
	mockCartRepo := new(MockCartRepository)
	mockCartItemRepo := new(MockCartItemRepository)

	mockOrderRepo.On("FindOrderByID", ctx, orderID).Return(order, nil)

	svc := NewOrderService(nil, mockOrderRepo, mockOrderItemRepo, mockCartRepo, mockCartItemRepo)

	// Execute
	err := svc.CancelOrder(ctx, userID, orderID)

	// Assert
	assert.Error(t, err)
	assert.Equal(t, ErrCannotCancel, err)
	mockOrderRepo.AssertNotCalled(t, "UpdateOrder")
}
