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

// MockOrderStatusHistoryRepository is a mock implementation of OrderStatusHistoryRepository
type MockOrderStatusHistoryRepository struct {
	mock.Mock
}

func (m *MockOrderStatusHistoryRepository) CreateStatusHistory(ctx context.Context, history *models.OrderStatusHistory) error {
	args := m.Called(ctx, history)
	return args.Error(0)
}

func (m *MockOrderStatusHistoryRepository) ListStatusHistory(ctx context.Context, orderID string) ([]*models.OrderStatusHistory, error) {
	args := m.Called(ctx, orderID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.OrderStatusHistory), args.Error(1)
}

// Test UpdateShippingInfo - Success case: Update pending order
func TestUpdateShippingInfo_Success(t *testing.T) {
	ctx := context.Background()
	userID := uuid.New().String()
	orderID := uuid.New().String()

	order := &models.Order{
		ID:              orderID,
		UserID:          userID,
		Status:          models.ORDER_STATUS_AWAITING_PAYMENT,
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

	mockHistoryRepo := new(MockOrderStatusHistoryRepository)
	svc := NewOrderService(nil, mockOrderRepo, mockOrderItemRepo, mockCartRepo, mockCartItemRepo, mockHistoryRepo)

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

	mockHistoryRepo := new(MockOrderStatusHistoryRepository)
	svc := NewOrderService(nil, mockOrderRepo, mockOrderItemRepo, mockCartRepo, mockCartItemRepo, mockHistoryRepo)

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

	mockHistoryRepo := new(MockOrderStatusHistoryRepository)
	svc := NewOrderService(nil, mockOrderRepo, mockOrderItemRepo, mockCartRepo, mockCartItemRepo, mockHistoryRepo)

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
		Status: models.ORDER_STATUS_AWAITING_PAYMENT,
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

	mockHistoryRepo := new(MockOrderStatusHistoryRepository)
	svc := NewOrderService(nil, mockOrderRepo, mockOrderItemRepo, mockCartRepo, mockCartItemRepo, mockHistoryRepo)

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
		Status: models.ORDER_STATUS_AWAITING_PAYMENT,
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

	mockHistoryRepo := new(MockOrderStatusHistoryRepository)
	svc := NewOrderService(nil, mockOrderRepo, mockOrderItemRepo, mockCartRepo, mockCartItemRepo, mockHistoryRepo)

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
		Status: models.ORDER_STATUS_AWAITING_PAYMENT,
	}

	req := &requests.UpdateOrderShippingRequest{}

	mockOrderRepo := new(MockOrderRepository)
	mockOrderItemRepo := new(MockOrderItemRepository)
	mockCartRepo := new(MockCartRepository)
	mockCartItemRepo := new(MockCartItemRepository)

	mockOrderRepo.On("FindOrderByID", ctx, orderID).Return(order, nil)
	// UpdateOrder should not be called when no fields are provided

	mockHistoryRepo := new(MockOrderStatusHistoryRepository)
	svc := NewOrderService(nil, mockOrderRepo, mockOrderItemRepo, mockCartRepo, mockCartItemRepo, mockHistoryRepo)

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
		{models.ORDER_STATUS_AWAITING_PAYMENT, true},
		{models.ORDER_STATUS_PAYMENT_SUBMITTED, false},
		{models.ORDER_STATUS_CONFIRMED, false},
		{models.ORDER_STATUS_SHIPPING, false},
		{models.ORDER_STATUS_COMPLETED, false},
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

			mockHistoryRepo := new(MockOrderStatusHistoryRepository)
	svc := NewOrderService(nil, mockOrderRepo, mockOrderItemRepo, mockCartRepo, mockCartItemRepo, mockHistoryRepo)

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

// Test UpdateStatus - uses real db for transaction support
func TestUpdateStatus(t *testing.T) {
	ctx := context.Background()
	db := setupTestDB(t)

	orderID := uuid.New().String()
	order := &models.Order{
		ID:     orderID,
		Status: models.ORDER_STATUS_PAYMENT_SUBMITTED,
	}
	db.Create(order)

	repo := &testRepo{db: db}
	svc := NewOrderService(db, repo, repo, repo, repo, repo)

	adminID := uuid.New().String()
	err := svc.UpdateStatus(ctx, orderID, models.ORDER_STATUS_CONFIRMED, adminID, "test note")

	assert.NoError(t, err)

	var updated models.Order
	db.First(&updated, "id = ?", orderID)
	assert.Equal(t, models.ORDER_STATUS_CONFIRMED, updated.Status)
}

// Test CancelOrder - Success (status 1 - no reason required)
func TestCancelOrder_Success(t *testing.T) {
	ctx := context.Background()
	db := setupTestDB(t)
	userID := uuid.New().String()
	orderID := uuid.New().String()

	order := &models.Order{
		ID:     orderID,
		UserID: userID,
		Status: models.ORDER_STATUS_AWAITING_PAYMENT,
	}
	db.Create(order)

	repo := &testRepo{db: db}
	svc := NewOrderService(db, repo, repo, repo, repo, repo)

	err := svc.CancelOrder(ctx, userID, orderID, "", false)

	assert.NoError(t, err)

	var updated models.Order
	db.First(&updated, "id = ?", orderID)
	assert.Equal(t, models.ORDER_STATUS_CANCELLED, updated.Status)
}

// Test CancelOrder - Status 2,3 requires reason
func TestCancelOrder_RequiresReason(t *testing.T) {
	ctx := context.Background()
	userID := uuid.New().String()
	orderID := uuid.New().String()

	order := &models.Order{
		ID:     orderID,
		UserID: userID,
		Status: models.ORDER_STATUS_PAYMENT_SUBMITTED,
	}

	mockOrderRepo := new(MockOrderRepository)
	mockOrderItemRepo := new(MockOrderItemRepository)
	mockCartRepo := new(MockCartRepository)
	mockCartItemRepo := new(MockCartItemRepository)
	mockHistoryRepo := new(MockOrderStatusHistoryRepository)

	mockOrderRepo.On("FindOrderByID", ctx, orderID).Return(order, nil)

	svc := NewOrderService(nil, mockOrderRepo, mockOrderItemRepo, mockCartRepo, mockCartItemRepo, mockHistoryRepo)

	// Execute - no reason should fail
	err := svc.CancelOrder(ctx, userID, orderID, "", false)

	// Assert
	assert.Error(t, err)
	assert.Equal(t, ErrReasonRequired, err)
	mockOrderRepo.AssertNotCalled(t, "UpdateOrder")
}

// Test MarkAsTransferred - Success: Mark awaiting payment order as transferred
func TestMarkAsTransferred_Success(t *testing.T) {
	ctx := context.Background()
	db := setupTestDB(t)
	userID := uuid.New().String()
	orderID := uuid.New().String()

	order := &models.Order{
		ID:     orderID,
		UserID: userID,
		Status: models.ORDER_STATUS_AWAITING_PAYMENT,
	}
	db.Create(order)

	repo := &testRepo{db: db}
	svc := NewOrderService(db, repo, repo, repo, repo, repo)

	err := svc.MarkAsTransferred(ctx, userID, orderID)

	assert.NoError(t, err)

	var updated models.Order
	db.First(&updated, "id = ?", orderID)
	assert.Equal(t, models.ORDER_STATUS_PAYMENT_SUBMITTED, updated.Status)
}

// Test MarkAsTransferred - Fail: Order not found
func TestMarkAsTransferred_OrderNotFound(t *testing.T) {
	ctx := context.Background()
	userID := uuid.New().String()
	orderID := uuid.New().String()

	mockOrderRepo := new(MockOrderRepository)
	mockOrderItemRepo := new(MockOrderItemRepository)
	mockCartRepo := new(MockCartRepository)
	mockCartItemRepo := new(MockCartItemRepository)

	mockOrderRepo.On("FindOrderByID", ctx, orderID).Return(nil, nil)

	mockHistoryRepo := new(MockOrderStatusHistoryRepository)
	svc := NewOrderService(nil, mockOrderRepo, mockOrderItemRepo, mockCartRepo, mockCartItemRepo, mockHistoryRepo)

	// Execute
	err := svc.MarkAsTransferred(ctx, userID, orderID)

	// Assert
	assert.Error(t, err)
	assert.Equal(t, ErrOrderNotFound, err)
	mockOrderRepo.AssertNotCalled(t, "UpdateOrder")
}

// Test MarkAsTransferred - Fail: Order not owned by user
func TestMarkAsTransferred_OrderNotOwned(t *testing.T) {
	ctx := context.Background()
	userID := uuid.New().String()
	otherUserID := uuid.New().String()
	orderID := uuid.New().String()

	order := &models.Order{
		ID:     orderID,
		UserID: otherUserID,
		Status: models.ORDER_STATUS_AWAITING_PAYMENT,
	}

	mockOrderRepo := new(MockOrderRepository)
	mockOrderItemRepo := new(MockOrderItemRepository)
	mockCartRepo := new(MockCartRepository)
	mockCartItemRepo := new(MockCartItemRepository)

	mockOrderRepo.On("FindOrderByID", ctx, orderID).Return(order, nil)

	mockHistoryRepo := new(MockOrderStatusHistoryRepository)
	svc := NewOrderService(nil, mockOrderRepo, mockOrderItemRepo, mockCartRepo, mockCartItemRepo, mockHistoryRepo)

	// Execute
	err := svc.MarkAsTransferred(ctx, userID, orderID)

	// Assert
	assert.Error(t, err)
	assert.Equal(t, ErrOrderNotOwned, err)
	mockOrderRepo.AssertNotCalled(t, "UpdateOrder")
}

// Test MarkAsTransferred - Fail: Order not awaiting payment
func TestMarkAsTransferred_NotAwaitingPayment(t *testing.T) {
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

	mockHistoryRepo := new(MockOrderStatusHistoryRepository)
	svc := NewOrderService(nil, mockOrderRepo, mockOrderItemRepo, mockCartRepo, mockCartItemRepo, mockHistoryRepo)

	// Execute
	err := svc.MarkAsTransferred(ctx, userID, orderID)

	// Assert
	assert.Error(t, err)
	assert.Equal(t, ErrNotAwaitingPayment, err)
	mockOrderRepo.AssertNotCalled(t, "UpdateOrder")
}

// Test MarkAsTransferred - Idempotent: Already submitted payment
func TestMarkAsTransferred_AlreadySubmitted(t *testing.T) {
	ctx := context.Background()
	userID := uuid.New().String()
	orderID := uuid.New().String()

	order := &models.Order{
		ID:     orderID,
		UserID: userID,
		Status: models.ORDER_STATUS_PAYMENT_SUBMITTED,
	}

	mockOrderRepo := new(MockOrderRepository)
	mockOrderItemRepo := new(MockOrderItemRepository)
	mockCartRepo := new(MockCartRepository)
	mockCartItemRepo := new(MockCartItemRepository)

	mockOrderRepo.On("FindOrderByID", ctx, orderID).Return(order, nil)

	mockHistoryRepo := new(MockOrderStatusHistoryRepository)
	svc := NewOrderService(nil, mockOrderRepo, mockOrderItemRepo, mockCartRepo, mockCartItemRepo, mockHistoryRepo)

	// Execute
	err := svc.MarkAsTransferred(ctx, userID, orderID)

	// Assert - Should succeed without updating (idempotent)
	assert.NoError(t, err)
	mockOrderRepo.AssertNotCalled(t, "UpdateOrder")
}

// Test MarkAsTransferred - Fail: Delivered order cannot be marked transferred
func TestMarkAsTransferred_DeliveredOrder(t *testing.T) {
	ctx := context.Background()
	userID := uuid.New().String()
	orderID := uuid.New().String()

	order := &models.Order{
		ID:     orderID,
		UserID: userID,
		Status: models.ORDER_STATUS_COMPLETED,
	}

	mockOrderRepo := new(MockOrderRepository)
	mockOrderItemRepo := new(MockOrderItemRepository)
	mockCartRepo := new(MockCartRepository)
	mockCartItemRepo := new(MockCartItemRepository)

	mockOrderRepo.On("FindOrderByID", ctx, orderID).Return(order, nil)

	mockHistoryRepo := new(MockOrderStatusHistoryRepository)
	svc := NewOrderService(nil, mockOrderRepo, mockOrderItemRepo, mockCartRepo, mockCartItemRepo, mockHistoryRepo)

	// Execute
	err := svc.MarkAsTransferred(ctx, userID, orderID)

	// Assert
	assert.Error(t, err)
	assert.Equal(t, ErrNotAwaitingPayment, err)
	mockOrderRepo.AssertNotCalled(t, "UpdateOrder")
}

// Test CancelOrder - Status 2 with reason succeeds
func TestCancelOrder_WithReason(t *testing.T) {
	ctx := context.Background()
	db := setupTestDB(t)
	userID := uuid.New().String()
	orderID := uuid.New().String()

	order := &models.Order{
		ID:     orderID,
		UserID: userID,
		Status: models.ORDER_STATUS_PAYMENT_SUBMITTED,
	}
	db.Create(order)

	repo := &testRepo{db: db}
	svc := NewOrderService(db, repo, repo, repo, repo, repo)

	err := svc.CancelOrder(ctx, userID, orderID, "Changed my mind", false)

	assert.NoError(t, err)

	var updated models.Order
	db.First(&updated, "id = ?", orderID)
	assert.Equal(t, models.ORDER_STATUS_CANCELLED, updated.Status)
}

// Test CancelOrder - Blocks cancellation of shipping orders (user)
func TestCancelOrder_ShippingOrder(t *testing.T) {
	ctx := context.Background()
	userID := uuid.New().String()
	orderID := uuid.New().String()

	order := &models.Order{
		ID:     orderID,
		UserID: userID,
		Status: models.ORDER_STATUS_SHIPPING,
	}

	mockOrderRepo := new(MockOrderRepository)
	mockOrderItemRepo := new(MockOrderItemRepository)
	mockCartRepo := new(MockCartRepository)
	mockCartItemRepo := new(MockCartItemRepository)
	mockHistoryRepo := new(MockOrderStatusHistoryRepository)

	mockOrderRepo.On("FindOrderByID", ctx, orderID).Return(order, nil)

	svc := NewOrderService(nil, mockOrderRepo, mockOrderItemRepo, mockCartRepo, mockCartItemRepo, mockHistoryRepo)

	// Execute - user cannot cancel shipping order
	err := svc.CancelOrder(ctx, userID, orderID, "reason", false)

	assert.Error(t, err)
	assert.Equal(t, ErrCannotCancel, err)
	mockOrderRepo.AssertNotCalled(t, "UpdateOrder")
}

// Test UpdateStatus - SHIPPING to CANCELLED (admin can cancel shipping order)
func TestUpdateStatus_ShippingToCancelled(t *testing.T) {
	ctx := context.Background()
	db := setupTestDB(t)
	orderID := uuid.New().String()
	variantID := uuid.New().String()

	order := &models.Order{
		ID:     orderID,
		Status: models.ORDER_STATUS_SHIPPING,
	}
	db.Create(order)

	variant := &models.ProductVariant{
		ID:    variantID,
		Stock: 5,
		Sold:  10,
	}
	db.Create(variant)

	orderItem := &models.OrderItem{
		ID:       uuid.New().String(),
		OrderID:  orderID,
		AttrID:   &variantID,
		Quantity: 2,
	}
	db.Create(orderItem)

	repo := &testRepo{db: db}
	svc := NewOrderService(db, repo, repo, repo, repo, repo)

	adminID := uuid.New().String()
	err := svc.UpdateStatus(ctx, orderID, models.ORDER_STATUS_CANCELLED, adminID, "delivery failed")

	assert.NoError(t, err)

	var updated models.Order
	db.First(&updated, "id = ?", orderID)
	assert.Equal(t, models.ORDER_STATUS_CANCELLED, updated.Status)

	var updatedVariant models.ProductVariant
	db.First(&updatedVariant, "id = ?", variantID)
	assert.Equal(t, 7, updatedVariant.Stock)
	assert.Equal(t, 8, updatedVariant.Sold)
}

// Test UpdateStatus - CONFIRMED deducts stock
func TestUpdateStatus_ConfirmedDeductsStock(t *testing.T) {
	ctx := context.Background()
	db := setupTestDB(t)
	orderID := uuid.New().String()
	variantID := uuid.New().String()

	order := &models.Order{
		ID:     orderID,
		Status: models.ORDER_STATUS_PAYMENT_SUBMITTED,
	}
	db.Create(order)

	variant := &models.ProductVariant{
		ID:    variantID,
		Stock: 10,
		Sold:  5,
	}
	db.Create(variant)

	orderItem := &models.OrderItem{
		ID:       uuid.New().String(),
		OrderID:  orderID,
		AttrID:   &variantID,
		Quantity: 3,
	}
	db.Create(orderItem)

	repo := &testRepo{db: db}
	svc := NewOrderService(db, repo, repo, repo, repo, repo)

	adminID := uuid.New().String()
	err := svc.UpdateStatus(ctx, orderID, models.ORDER_STATUS_CONFIRMED, adminID, "payment verified")

	assert.NoError(t, err)

	var updatedVariant models.ProductVariant
	db.First(&updatedVariant, "id = ?", variantID)
	assert.Equal(t, 7, updatedVariant.Stock)
	assert.Equal(t, 8, updatedVariant.Sold)
}

// Test UpdateStatus - CANCELLED restores stock (from CONFIRMED)
func TestUpdateStatus_CancelledRestoresStock(t *testing.T) {
	ctx := context.Background()
	db := setupTestDB(t)
	orderID := uuid.New().String()
	variantID := uuid.New().String()

	order := &models.Order{
		ID:     orderID,
		Status: models.ORDER_STATUS_CONFIRMED,
	}
	db.Create(order)

	variant := &models.ProductVariant{
		ID:    variantID,
		Stock: 5,
		Sold:  10,
	}
	db.Create(variant)

	orderItem := &models.OrderItem{
		ID:       uuid.New().String(),
		OrderID:  orderID,
		AttrID:   &variantID,
		Quantity: 2,
	}
	db.Create(orderItem)

	repo := &testRepo{db: db}
	svc := NewOrderService(db, repo, repo, repo, repo, repo)

	adminID := uuid.New().String()
	err := svc.UpdateStatus(ctx, orderID, models.ORDER_STATUS_CANCELLED, adminID, "customer requested")

	assert.NoError(t, err)

	var updatedVariant models.ProductVariant
	db.First(&updatedVariant, "id = ?", variantID)
	assert.Equal(t, 7, updatedVariant.Stock)
	assert.Equal(t, 8, updatedVariant.Sold)
}

// Test UpdateStatus - CANCELLED before CONFIRMED does not change stock
func TestUpdateStatus_CancelledBeforeConfirmed_NoStockChange(t *testing.T) {
	ctx := context.Background()
	db := setupTestDB(t)
	orderID := uuid.New().String()
	variantID := uuid.New().String()

	order := &models.Order{
		ID:     orderID,
		Status: models.ORDER_STATUS_PAYMENT_SUBMITTED,
	}
	db.Create(order)

	variant := &models.ProductVariant{
		ID:    variantID,
		Stock: 10,
		Sold:  5,
	}
	db.Create(variant)

	orderItem := &models.OrderItem{
		ID:       uuid.New().String(),
		OrderID:  orderID,
		AttrID:   &variantID,
		Quantity: 2,
	}
	db.Create(orderItem)

	repo := &testRepo{db: db}
	svc := NewOrderService(db, repo, repo, repo, repo, repo)

	adminID := uuid.New().String()
	err := svc.UpdateStatus(ctx, orderID, models.ORDER_STATUS_CANCELLED, adminID, "cancelled before confirm")

	assert.NoError(t, err)

	var updatedVariant models.ProductVariant
	db.First(&updatedVariant, "id = ?", variantID)
	assert.Equal(t, 10, updatedVariant.Stock)
	assert.Equal(t, 5, updatedVariant.Sold)
}
