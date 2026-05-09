package services

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/vlahanam/rol-outfit/src/internal/dto"
	"github.com/vlahanam/rol-outfit/src/internal/models"
	"github.com/vlahanam/rol-outfit/src/internal/repositories"
	"github.com/vlahanam/rol-outfit/src/internal/requests"
)

var (
	ErrCartItemNotFound = errors.New("cart item not found")
	ErrCartItemNotOwned = errors.New("cart item does not belong to user")
)

type CartService interface {
	GetCart(ctx context.Context, userID string) (*models.Cart, []*models.CartItem, error)
	AddItem(ctx context.Context, userID string, req *requests.AddCartItemRequest) (*models.CartItem, error)
	UpdateItem(ctx context.Context, userID, itemID string, req *requests.UpdateCartItemRequest) error
	RemoveItem(ctx context.Context, userID, itemID string) error
}

type cartService struct {
	cartRepo     repositories.CartRepository
	cartItemRepo repositories.CartItemRepository
	productRepo  repositories.ProductRepository
	variantRepo  repositories.ProductVariantRepository
}

func NewCartService(
	cartRepo repositories.CartRepository,
	cartItemRepo repositories.CartItemRepository,
	productRepo repositories.ProductRepository,
	variantRepo repositories.ProductVariantRepository,
) CartService {
	return &cartService{
		cartRepo:     cartRepo,
		cartItemRepo: cartItemRepo,
		productRepo:  productRepo,
		variantRepo:  variantRepo,
	}
}

func (s *cartService) GetCart(ctx context.Context, userID string) (*models.Cart, []*models.CartItem, error) {
	cart, err := s.cartRepo.FindOrCreateCart(ctx, userID)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to get cart: %w", err)
	}
	items, err := s.cartItemRepo.ListCartItems(ctx, cart.ID)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to list cart items: %w", err)
	}
	return cart, items, nil
}

func (s *cartService) AddItem(ctx context.Context, userID string, req *requests.AddCartItemRequest) (*models.CartItem, error) {
	cart, err := s.cartRepo.FindOrCreateCart(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get cart: %w", err)
	}

	product, err := s.productRepo.FindProductByID(ctx, req.ProductID)
	if err != nil {
		return nil, fmt.Errorf("failed to find product: %w", err)
	}
	if product == nil {
		return nil, ErrProductNotFound
	}

	// Accumulate quantity if same product+attr already in cart
	existing, err := s.cartItemRepo.FindCartItem(ctx, cart.ID, req.ProductID, req.AttrID)
	if err != nil {
		return nil, fmt.Errorf("failed to check existing cart item: %w", err)
	}
	if existing != nil {
		newQty := existing.Quantity + req.Quantity
		if err := s.cartItemRepo.UpdateCartItem(ctx, existing.ID, map[string]interface{}{"quantity": newQty}); err != nil {
			return nil, fmt.Errorf("failed to update cart item quantity: %w", err)
		}
		existing.Quantity = newQty
		return existing, nil
	}

	priceAtAdd := product.DefaultPrice
	if req.AttrID != "" {
		v, err := s.variantRepo.FindVariantByID(ctx, req.AttrID)
		if err != nil {
			return nil, fmt.Errorf("failed to find variant: %w", err)
		}
		if v != nil && v.ProductID == product.ID {
			priceAtAdd = v.Price
			if dto.IsDiscountActive(v.DiscountPercent, v.DiscountStartAt, v.DiscountEndAt) {
				priceAtAdd = dto.EffectivePrice(v.Price, v.DiscountPercent, v.DiscountStartAt, v.DiscountEndAt)
			} else if dto.IsDiscountActive(product.DiscountPercent, product.DiscountStartAt, product.DiscountEndAt) {
				priceAtAdd = dto.EffectivePrice(v.Price, product.DiscountPercent, product.DiscountStartAt, product.DiscountEndAt)
			}
		}
	} else if dto.IsDiscountActive(product.DiscountPercent, product.DiscountStartAt, product.DiscountEndAt) {
		priceAtAdd = dto.EffectivePrice(product.DefaultPrice, product.DiscountPercent, product.DiscountStartAt, product.DiscountEndAt)
	}

	item := &models.CartItem{
		ID:         uuid.New().String(),
		CartID:     cart.ID,
		ProductID:  req.ProductID,
		AttrID:     req.AttrID,
		PriceAtAdd: priceAtAdd,
		Quantity:   req.Quantity,
	}
	if err := s.cartItemRepo.CreateCartItem(ctx, item); err != nil {
		return nil, fmt.Errorf("failed to create cart item: %w", err)
	}
	return item, nil
}

func (s *cartService) UpdateItem(ctx context.Context, userID, itemID string, req *requests.UpdateCartItemRequest) error {
	if err := s.verifyItemOwnership(ctx, userID, itemID); err != nil {
		return err
	}
	return s.cartItemRepo.UpdateCartItem(ctx, itemID, map[string]interface{}{"quantity": req.Quantity})
}

func (s *cartService) RemoveItem(ctx context.Context, userID, itemID string) error {
	if err := s.verifyItemOwnership(ctx, userID, itemID); err != nil {
		return err
	}
	return s.cartItemRepo.DeleteCartItem(ctx, itemID)
}

func (s *cartService) verifyItemOwnership(ctx context.Context, userID, itemID string) error {
	item, err := s.cartItemRepo.FindCartItemByID(ctx, itemID)
	if err != nil {
		return fmt.Errorf("failed to find cart item: %w", err)
	}
	if item == nil {
		return ErrCartItemNotFound
	}
	cart, err := s.cartRepo.FindCartByUserID(ctx, userID)
	if err != nil {
		return fmt.Errorf("failed to find cart: %w", err)
	}
	if cart == nil || item.CartID != cart.ID {
		return ErrCartItemNotOwned
	}
	return nil
}
