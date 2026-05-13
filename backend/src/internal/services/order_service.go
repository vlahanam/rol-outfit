package services

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/vlahanam/rol-outfit/src/internal/models"
	"github.com/vlahanam/rol-outfit/src/internal/repositories"
	"github.com/vlahanam/rol-outfit/src/internal/requests"
	"gorm.io/gorm"
)

var (
	ErrOrderNotFound = errors.New("order not found")
	ErrOrderNotOwned = errors.New("order does not belong to user")
	ErrCartEmpty     = errors.New("cart is empty")
	ErrCannotCancel  = errors.New("order cannot be cancelled in current status")
)

type OrderService interface {
	CreateFromCart(ctx context.Context, userID string, req *requests.CreateOrderRequest) (*models.Order, []*models.OrderItem, error)
	GetOrder(ctx context.Context, userID, orderID string, isAdmin bool) (*models.Order, []*models.OrderItem, error)
	ListUserOrders(ctx context.Context, userID string, offset, limit int) ([]*models.Order, int64, error)
	ListAllOrders(ctx context.Context, status int8, offset, limit int) ([]*models.Order, int64, error)
	UpdateStatus(ctx context.Context, orderID string, status int8) error
	CancelOrder(ctx context.Context, userID, orderID string) error
}

type orderService struct {
	db            *gorm.DB
	orderRepo     repositories.OrderRepository
	orderItemRepo repositories.OrderItemRepository
	cartRepo      repositories.CartRepository
	cartItemRepo  repositories.CartItemRepository
}

func NewOrderService(
	db *gorm.DB,
	orderRepo repositories.OrderRepository,
	orderItemRepo repositories.OrderItemRepository,
	cartRepo repositories.CartRepository,
	cartItemRepo repositories.CartItemRepository,
) OrderService {
	return &orderService{
		db:            db,
		orderRepo:     orderRepo,
		orderItemRepo: orderItemRepo,
		cartRepo:      cartRepo,
		cartItemRepo:  cartItemRepo,
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

		cartItems, err := txRepo.ListCartItems(ctx, cart.ID)
		if err != nil {
			return fmt.Errorf("failed to list cart items: %w", err)
		}
		if len(cartItems) == 0 {
			return ErrCartEmpty
		}

		var totalPrice float64
		for _, item := range cartItems {
			totalPrice += item.PriceAtAdd * float64(item.Quantity)
		}

		order = &models.Order{
			ID:              uuid.New().String(),
			UserID:          userID,
			ShippingAddress: req.ShippingAddress,
			Phone:           req.Phone,
			TotalPrice:      totalPrice,
			Status:          models.ORDER_STATUS_PENDING,
			Note:            req.Note,
		}

		orderItems = make([]*models.OrderItem, 0, len(cartItems))
		for _, ci := range cartItems {
			orderItems = append(orderItems, &models.OrderItem{
				ID:        uuid.New().String(),
				OrderID:   order.ID,
				ProductID: ci.ProductID,
				AttrID:    ci.AttrID,
				Price:     ci.PriceAtAdd,
				Quantity:  ci.Quantity,
			})
		}

		if err := txRepo.CreateOrder(ctx, order); err != nil {
			return err
		}
		if err := txRepo.CreateOrderItems(ctx, orderItems); err != nil {
			return err
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

func (s *orderService) UpdateStatus(ctx context.Context, orderID string, status int8) error {
	order, err := s.orderRepo.FindOrderByID(ctx, orderID)
	if err != nil {
		return fmt.Errorf("failed to find order: %w", err)
	}
	if order == nil {
		return ErrOrderNotFound
	}
	return s.orderRepo.UpdateOrder(ctx, orderID, map[string]interface{}{"status": status})
}

func (s *orderService) CancelOrder(ctx context.Context, userID, orderID string) error {
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
	if order.Status != models.ORDER_STATUS_PENDING {
		return ErrCannotCancel
	}
	return s.orderRepo.UpdateOrder(ctx, orderID, map[string]interface{}{"status": models.ORDER_STATUS_CANCELLED})
}
