package services

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/vlahanam/rol-outfit/src/internal/models"
	"github.com/vlahanam/rol-outfit/src/internal/repositories"
	"github.com/vlahanam/rol-outfit/src/internal/requests"
	"gorm.io/gorm"
)

var (
	ErrOrderNotFound        = errors.New("order not found")
	ErrOrderNotOwned        = errors.New("order does not belong to user")
	ErrCartEmpty            = errors.New("cart is empty")
	ErrCannotCancel         = errors.New("order cannot be cancelled in current status")
	ErrCannotUpdateShipping = errors.New("cannot update shipping info for non-pending order")
	ErrNotAwaitingPayment   = errors.New("order is not awaiting payment")
	ErrInvalidTransition    = errors.New("invalid status transition")
	ErrCannotUploadBill     = errors.New("cannot upload bill for order in current status")
	ErrCannotRequestRefund  = errors.New("can only request refund for completed orders")
	ErrNotRefundRequest     = errors.New("order is not pending refund approval")
	ErrReasonRequired       = errors.New("cancellation reason is required")
)

type OrderService interface {
	CreateFromCart(ctx context.Context, userID string, req *requests.CreateOrderRequest) (*models.Order, []*models.OrderItem, error)
	GetOrder(ctx context.Context, userID, orderID string, isAdmin bool) (*models.Order, []*models.OrderItem, error)
	ListUserOrders(ctx context.Context, userID string, offset, limit int) ([]*models.Order, int64, error)
	ListAllOrders(ctx context.Context, status int8, offset, limit int) ([]*models.Order, int64, error)
	UpdateStatus(ctx context.Context, orderID string, newStatus int8, changedBy string, note string) error
	UpdateShippingInfo(ctx context.Context, userID, orderID string, req *requests.UpdateOrderShippingRequest) error
	CancelOrder(ctx context.Context, userID, orderID, reason string, isAdmin bool) error
	UploadBill(ctx context.Context, userID, orderID, billURL string) error
	RequestRefund(ctx context.Context, userID, orderID string, reason string) error
	ApproveRefund(ctx context.Context, orderID string, adminID string) error
	RejectRefund(ctx context.Context, orderID string, adminID string, reason string) error
	RefundCancelledOrder(ctx context.Context, orderID, adminID string) error
	GetOrderHistory(ctx context.Context, orderID string) ([]*models.OrderStatusHistory, error)
}

type orderService struct {
	db            *gorm.DB
	orderRepo     repositories.OrderRepository
	orderItemRepo repositories.OrderItemRepository
	cartRepo      repositories.CartRepository
	cartItemRepo  repositories.CartItemRepository
	historyRepo   repositories.OrderStatusHistoryRepository
}

func NewOrderService(
	db *gorm.DB,
	orderRepo repositories.OrderRepository,
	orderItemRepo repositories.OrderItemRepository,
	cartRepo repositories.CartRepository,
	cartItemRepo repositories.CartItemRepository,
	historyRepo repositories.OrderStatusHistoryRepository,
) OrderService {
	return &orderService{
		db:            db,
		orderRepo:     orderRepo,
		orderItemRepo: orderItemRepo,
		cartRepo:      cartRepo,
		cartItemRepo:  cartItemRepo,
		historyRepo:   historyRepo,
	}
}

func (s *orderService) CreateFromCart(ctx context.Context, userID string, req *requests.CreateOrderRequest) (*models.Order, []*models.OrderItem, error) {
	cart, err := s.cartRepo.FindOrCreateCart(ctx, userID)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to get cart: %w", err)
	}

	var order *models.Order
	var orderItems []*models.OrderItem

	// Read cart items inside transaction to prevent stale snapshot on concurrent checkout.
	err = s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		txRepo := repositories.NewPostgreSQLStorage(tx)

		allCartItems, err := txRepo.ListCartItems(ctx, cart.ID)
		if err != nil {
			return fmt.Errorf("failed to list cart items: %w", err)
		}
		if len(allCartItems) == 0 {
			return ErrCartEmpty
		}

		var cartItems []*models.CartItem
		if len(req.CartItemIds) > 0 {
			selectedIds := make(map[string]bool)
			for _, id := range req.CartItemIds {
				selectedIds[id] = true
			}
			for _, item := range allCartItems {
				if selectedIds[item.ID] {
					cartItems = append(cartItems, item)
				}
			}
			if len(cartItems) == 0 {
				return ErrCartEmpty
			}
		} else {
			cartItems = allCartItems
		}

		var totalPrice float64
		var totalShipping float64
		allJapanese := true
		for _, item := range cartItems {
			totalPrice += item.PriceAtAdd * float64(item.Quantity)
			product, err := txRepo.FindProductByIDNoFilter(ctx, item.ProductID)
			if err == nil && product != nil {
				totalShipping += product.ShippingCost * float64(item.Quantity)
				if product.ProductType != models.PRODUCT_TYPE_JAPANESE {
					allJapanese = false
				}
			} else {
				allJapanese = false
			}
		}
		currencyType := models.PRODUCT_TYPE_VIETNAMESE
		if allJapanese {
			currencyType = models.PRODUCT_TYPE_JAPANESE
		}

		// Free shipping threshold: 15000 yen for Japanese orders, 500000 VND for Vietnamese orders
		if allJapanese && totalPrice >= 15000 {
			totalShipping = 0
		} else if !allJapanese && totalPrice >= 500000 {
			totalShipping = 0
		}

		orderCode, err := txRepo.GenerateOrderCode(ctx)
		if err != nil {
			return fmt.Errorf("failed to generate order code: %w", err)
		}

		order = &models.Order{
			ID:              uuid.New().String(),
			OrderCode:       &orderCode,
			UserID:          userID,
			ShippingAddress: req.ShippingAddress,
			PostalCode:      req.PostalCode,
			Phone:           req.Phone,
			TotalPrice:      totalPrice + totalShipping,
			ShippingCost:    totalShipping,
			CurrencyType:    currencyType,
			Status:          models.ORDER_STATUS_AWAITING_PAYMENT,
			Note:            req.Note,
		}

		orderItems = make([]*models.OrderItem, 0, len(cartItems))
		for _, ci := range cartItems {
			item := &models.OrderItem{
				ID:        uuid.New().String(),
				OrderID:   order.ID,
				ProductID: ci.ProductID,
				AttrID:    ci.AttrID,
				Price:     ci.PriceAtAdd,
				Quantity:  ci.Quantity,
			}
			if product, err := txRepo.FindProductByIDNoFilter(ctx, ci.ProductID); err == nil && product != nil {
				item.ProductName = product.Name
			}
			if ci.AttrID != nil && *ci.AttrID != "" {
				if variant, err := txRepo.FindVariantByID(ctx, *ci.AttrID); err == nil && variant != nil {
					item.VariantName = variant.Name
				}
			}
			orderItems = append(orderItems, item)
		}

		if err := txRepo.CreateOrder(ctx, order); err != nil {
			return err
		}
		if err := txRepo.CreateOrderItems(ctx, orderItems); err != nil {
			return err
		}

		if len(req.CartItemIds) > 0 {
			for _, ci := range cartItems {
				if err := txRepo.DeleteCartItem(ctx, ci.ID); err != nil {
					return err
				}
			}
			return nil
		}
		return txRepo.ClearCart(ctx, cart.ID)
	})
	if err != nil {
		return nil, nil, fmt.Errorf("failed to create order: %w", err)
	}

	return order, orderItems, nil
}

func (s *orderService) GetOrder(ctx context.Context, userID, orderID string, isAdmin bool) (*models.Order, []*models.OrderItem, error) {
	order, err := s.orderRepo.FindOrderByID(ctx, orderID)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to find order: %w", err)
	}
	if order == nil {
		return nil, nil, ErrOrderNotFound
	}
	if !isAdmin && order.UserID != userID {
		return nil, nil, ErrOrderNotOwned
	}
	items, err := s.orderItemRepo.ListOrderItems(ctx, orderID)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to list order items: %w", err)
	}
	return order, items, nil
}

func (s *orderService) ListUserOrders(ctx context.Context, userID string, offset, limit int) ([]*models.Order, int64, error) {
	return s.orderRepo.ListOrdersByUser(ctx, userID, offset, limit)
}

func (s *orderService) ListAllOrders(ctx context.Context, status int8, offset, limit int) ([]*models.Order, int64, error) {
	return s.orderRepo.ListAllOrders(ctx, status, offset, limit)
}

func (s *orderService) UpdateStatus(ctx context.Context, orderID string, newStatus int8, changedBy string, note string) error {
	return s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		txRepo := repositories.NewPostgreSQLStorage(tx)

		order, err := txRepo.FindOrderByID(ctx, orderID)
		if err != nil {
			return fmt.Errorf("failed to find order: %w", err)
		}
		if order == nil {
			return ErrOrderNotFound
		}

		if !models.IsValidTransition(order.Status, newStatus) {
			return ErrInvalidTransition
		}

		// Stock deduction on CONFIRMED (only if coming from a status before CONFIRMED)
		if newStatus == models.ORDER_STATUS_CONFIRMED && order.Status < models.ORDER_STATUS_CONFIRMED {
			if err := s.handleStockDeduction(ctx, txRepo, orderID); err != nil {
				return err
			}
		}

		// Stock restoration on CANCELLED (only if order was CONFIRMED or later)
		if newStatus == models.ORDER_STATUS_CANCELLED && order.Status >= models.ORDER_STATUS_CONFIRMED {
			if err := s.handleStockRestoration(ctx, txRepo, orderID); err != nil {
				return err
			}
		}

		history := &models.OrderStatusHistory{
			ID:         uuid.New().String(),
			OrderID:    orderID,
			FromStatus: &order.Status,
			ToStatus:   newStatus,
			Note:       note,
		}
		if changedBy != "" {
			history.ChangedBy = &changedBy
		}
		if err := txRepo.CreateStatusHistory(ctx, history); err != nil {
			return err
		}

		return txRepo.UpdateOrder(ctx, orderID, map[string]interface{}{"status": newStatus})
	})
}

type stockRepo interface {
	ListOrderItems(ctx context.Context, orderID string) ([]*models.OrderItem, error)
	DeductStock(ctx context.Context, variantID string, quantity int) error
	RestoreStock(ctx context.Context, variantID string, quantity int) error
}

func (s *orderService) handleStockDeduction(ctx context.Context, repo stockRepo, orderID string) error {
	items, err := repo.ListOrderItems(ctx, orderID)
	if err != nil {
		return fmt.Errorf("failed to get order items: %w", err)
	}
	for _, item := range items {
		if item.AttrID != nil && *item.AttrID != "" {
			if err := repo.DeductStock(ctx, *item.AttrID, item.Quantity); err != nil {
				return fmt.Errorf("failed to deduct stock for variant %s: %w", *item.AttrID, err)
			}
		}
	}
	return nil
}

func (s *orderService) handleStockRestoration(ctx context.Context, repo stockRepo, orderID string) error {
	items, err := repo.ListOrderItems(ctx, orderID)
	if err != nil {
		return fmt.Errorf("failed to get order items: %w", err)
	}
	for _, item := range items {
		if item.AttrID != nil && *item.AttrID != "" {
			if err := repo.RestoreStock(ctx, *item.AttrID, item.Quantity); err != nil {
				return fmt.Errorf("failed to restore stock for variant %s: %w", *item.AttrID, err)
			}
		}
	}
	return nil
}

func (s *orderService) UpdateShippingInfo(ctx context.Context, userID, orderID string, req *requests.UpdateOrderShippingRequest) error {
	order, err := s.orderRepo.FindOrderByID(ctx, orderID)
	if err != nil {
		return fmt.Errorf("failed to find order: %w", err)
	}
	if order == nil {
		return ErrOrderNotFound
	}
	if order.UserID != userID {
		return ErrOrderNotOwned
	}
	if order.Status != models.ORDER_STATUS_AWAITING_PAYMENT {
		return ErrCannotUpdateShipping
	}

	fields := map[string]interface{}{}
	if req.ShippingAddress != nil {
		fields["shipping_address"] = *req.ShippingAddress
	}
	if req.PostalCode != nil {
		fields["postal_code"] = *req.PostalCode
	}
	if req.Phone != nil {
		fields["phone"] = *req.Phone
	}
	if req.Note != nil {
		fields["note"] = *req.Note
	}

	if len(fields) == 0 {
		return nil
	}
	return s.orderRepo.UpdateOrder(ctx, orderID, fields)
}

func (s *orderService) CancelOrder(ctx context.Context, userID, orderID, reason string, isAdmin bool) error {
	order, err := s.orderRepo.FindOrderByID(ctx, orderID)
	if err != nil {
		return fmt.Errorf("failed to find order: %w", err)
	}
	if order == nil {
		return ErrOrderNotFound
	}
	if !isAdmin && order.UserID != userID {
		return ErrOrderNotOwned
	}
	if order.Status > models.ORDER_STATUS_CONFIRMED {
		return ErrCannotCancel
	}

	if order.Status == models.ORDER_STATUS_PAYMENT_SUBMITTED ||
		order.Status == models.ORDER_STATUS_CONFIRMED {
		if strings.TrimSpace(reason) == "" {
			return ErrReasonRequired
		}
	}

	note := "Order cancelled"
	if reason != "" {
		note = reason
	}

	changedBy := userID
	return s.UpdateStatus(ctx, orderID, models.ORDER_STATUS_CANCELLED, changedBy, note)
}

func (s *orderService) UploadBill(ctx context.Context, userID, orderID, billURL string) error {
	return s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		txRepo := repositories.NewPostgreSQLStorage(tx)

		order, err := txRepo.FindOrderByID(ctx, orderID)
		if err != nil {
			return fmt.Errorf("failed to find order: %w", err)
		}
		if order == nil {
			return ErrOrderNotFound
		}
		if order.UserID != userID {
			return ErrOrderNotOwned
		}
		if order.Status != models.ORDER_STATUS_AWAITING_PAYMENT &&
			order.Status != models.ORDER_STATUS_PAYMENT_SUBMITTED {
			return ErrCannotUploadBill
		}

		updates := map[string]interface{}{"transfer_bill": billURL}
		if order.Status == models.ORDER_STATUS_AWAITING_PAYMENT {
			updates["status"] = models.ORDER_STATUS_PAYMENT_SUBMITTED

			history := &models.OrderStatusHistory{
				ID:         uuid.New().String(),
				OrderID:    orderID,
				FromStatus: &order.Status,
				ToStatus:   models.ORDER_STATUS_PAYMENT_SUBMITTED,
				ChangedBy:  &userID,
				Note:       "Bill uploaded",
			}
			if err := txRepo.CreateStatusHistory(ctx, history); err != nil {
				return fmt.Errorf("failed to create status history: %w", err)
			}
		}

		return txRepo.UpdateOrder(ctx, orderID, updates)
	})
}

func (s *orderService) RequestRefund(ctx context.Context, userID, orderID string, reason string) error {
	order, err := s.orderRepo.FindOrderByID(ctx, orderID)
	if err != nil {
		return fmt.Errorf("failed to find order: %w", err)
	}
	if order == nil {
		return ErrOrderNotFound
	}
	if order.UserID != userID {
		return ErrOrderNotOwned
	}
	if order.Status != models.ORDER_STATUS_COMPLETED {
		return ErrCannotRequestRefund
	}
	return s.UpdateStatus(ctx, orderID, models.ORDER_STATUS_REFUND_REQUESTED, userID, reason)
}

func (s *orderService) ApproveRefund(ctx context.Context, orderID string, adminID string) error {
	order, err := s.orderRepo.FindOrderByID(ctx, orderID)
	if err != nil {
		return fmt.Errorf("failed to find order: %w", err)
	}
	if order == nil {
		return ErrOrderNotFound
	}
	if order.Status != models.ORDER_STATUS_REFUND_REQUESTED {
		return ErrNotRefundRequest
	}
	return s.UpdateStatus(ctx, orderID, models.ORDER_STATUS_REFUNDED, adminID, "Refund approved")
}

func (s *orderService) RejectRefund(ctx context.Context, orderID string, adminID string, reason string) error {
	order, err := s.orderRepo.FindOrderByID(ctx, orderID)
	if err != nil {
		return fmt.Errorf("failed to find order: %w", err)
	}
	if order == nil {
		return ErrOrderNotFound
	}
	if order.Status != models.ORDER_STATUS_REFUND_REQUESTED {
		return ErrNotRefundRequest
	}
	return s.UpdateStatus(ctx, orderID, models.ORDER_STATUS_COMPLETED, adminID, "Refund rejected: "+reason)
}

func (s *orderService) RefundCancelledOrder(ctx context.Context, orderID, adminID string) error {
	order, err := s.orderRepo.FindOrderByID(ctx, orderID)
	if err != nil {
		return fmt.Errorf("failed to find order: %w", err)
	}
	if order == nil {
		return ErrOrderNotFound
	}
	if order.Status != models.ORDER_STATUS_CANCELLED {
		return ErrInvalidTransition
	}
	return s.UpdateStatus(ctx, orderID, models.ORDER_STATUS_REFUNDED, adminID, "Refunded cancelled order")
}

func (s *orderService) GetOrderHistory(ctx context.Context, orderID string) ([]*models.OrderStatusHistory, error) {
	return s.historyRepo.ListStatusHistory(ctx, orderID)
}
