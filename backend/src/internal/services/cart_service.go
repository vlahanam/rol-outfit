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
	ListAllCarts(ctx context.Context, offset, limit int, search string) ([]*dto.AdminCartListItemDTO, int64, error)
	GetCartByID(ctx context.Context, cartID string) (*dto.AdminCartDetailDTO, error)
	DeleteCart(ctx context.Context, cartID string) error
}

type cartService struct {
	cartRepo     repositories.CartRepository
	cartItemRepo repositories.CartItemRepository
	productRepo  repositories.ProductRepository
	variantRepo  repositories.ProductVariantRepository
	userRepo     repositories.UserRepository
	uploadRepo   repositories.UploadRepository
}

func NewCartService(
	cartRepo repositories.CartRepository,
	cartItemRepo repositories.CartItemRepository,
	productRepo repositories.ProductRepository,
	variantRepo repositories.ProductVariantRepository,
	uploadRepo repositories.UploadRepository,
) CartService {
	return &cartService{
		cartRepo:     cartRepo,
		cartItemRepo: cartItemRepo,
		productRepo:  productRepo,
		variantRepo:  variantRepo,
		uploadRepo:   uploadRepo,
	}
}

func NewCartServiceWithUserRepo(
	cartRepo repositories.CartRepository,
	cartItemRepo repositories.CartItemRepository,
	productRepo repositories.ProductRepository,
	variantRepo repositories.ProductVariantRepository,
	uploadRepo repositories.UploadRepository,
	userRepo repositories.UserRepository,
) CartService {
	return &cartService{
		cartRepo:     cartRepo,
		cartItemRepo: cartItemRepo,
		productRepo:  productRepo,
		variantRepo:  variantRepo,
		uploadRepo:   uploadRepo,
		userRepo:     userRepo,
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

	var attrID *string
	if req.AttrID != "" {
		attrID = &req.AttrID
	}
	item := &models.CartItem{
		ID:         uuid.New().String(),
		CartID:     cart.ID,
		ProductID:  req.ProductID,
		AttrID:     attrID,
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

var ErrCartNotFound = errors.New("cart not found")

func (s *cartService) ListAllCarts(ctx context.Context, offset, limit int, search string) ([]*dto.AdminCartListItemDTO, int64, error) {
	carts, total, err := s.cartRepo.ListAllCarts(ctx, offset, limit, search)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to list carts: %w", err)
	}

	result := make([]*dto.AdminCartListItemDTO, 0, len(carts))
	for _, cart := range carts {
		user, _ := s.userRepo.FindByID(ctx, cart.UserID)
		items, _ := s.cartItemRepo.ListCartItems(ctx, cart.ID)

		var total float64
		var updatedAt string
		for _, item := range items {
			total += item.PriceAtAdd * float64(item.Quantity)
			if updatedAt == "" || item.UpdatedAt.After(cart.CreatedAt) {
				updatedAt = item.UpdatedAt.Format("15:04 02/01/2006")
			}
		}
		if updatedAt == "" {
			updatedAt = cart.CreatedAt.Format("15:04 02/01/2006")
		}

		fullName := ""
		email := ""
		if user != nil {
			fullName = user.FullName
			email = user.Email
		}

		result = append(result, &dto.AdminCartListItemDTO{
			ID:           cart.ID,
			UserID:       cart.UserID,
			UserFullName: fullName,
			UserEmail:    email,
			ItemCount:    len(items),
			Total:        total,
			UpdatedAt:    updatedAt,
		})
	}

	return result, total, nil
}

func (s *cartService) GetCartByID(ctx context.Context, cartID string) (*dto.AdminCartDetailDTO, error) {
	cart, err := s.cartRepo.FindCartByID(ctx, cartID)
	if err != nil {
		return nil, fmt.Errorf("failed to find cart: %w", err)
	}
	if cart == nil {
		return nil, ErrCartNotFound
	}

	user, _ := s.userRepo.FindByID(ctx, cart.UserID)
	items, err := s.cartItemRepo.ListCartItems(ctx, cart.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to list cart items: %w", err)
	}

	var total float64
	var latestUpdate = cart.CreatedAt
	dtoItems := make([]*dto.AdminCartItemDTO, 0, len(items))
	for _, item := range items {
		subtotal := item.PriceAtAdd * float64(item.Quantity)
		total += subtotal
		if item.UpdatedAt.After(latestUpdate) {
			latestUpdate = item.UpdatedAt
		}

		product, _ := s.productRepo.FindProductByID(ctx, item.ProductID)
		productName := ""
		var productImages []*dto.UploadDTO
		if product != nil {
			productName = product.Name
			uploads, _ := s.uploadRepo.ListUploadsByModel(ctx, "product", product.ID)
			for _, u := range uploads {
				productImages = append(productImages, dto.ToUploadDTO(u))
			}
		}

		attrID := ""
		attrName := ""
		if item.AttrID != nil {
			attrID = *item.AttrID
			variant, _ := s.variantRepo.FindVariantByID(ctx, attrID)
			if variant != nil && len(variant.Attributes) > 0 {
				attrName = string(variant.Attributes)
			}
		}

		dtoItems = append(dtoItems, &dto.AdminCartItemDTO{
			ID:            item.ID,
			ProductID:     item.ProductID,
			ProductName:   productName,
			ProductImages: productImages,
			AttrID:        attrID,
			AttrName:      attrName,
			PriceAtAdd:    item.PriceAtAdd,
			Quantity:      item.Quantity,
			Subtotal:      subtotal,
		})
	}

	fullName := ""
	email := ""
	if user != nil {
		fullName = user.FullName
		email = user.Email
	}

	return &dto.AdminCartDetailDTO{
		ID:           cart.ID,
		UserID:       cart.UserID,
		UserFullName: fullName,
		UserEmail:    email,
		Items:        dtoItems,
		Total:        total,
		CreatedAt:    cart.CreatedAt.Format("15:04 02/01/2006"),
		UpdatedAt:    latestUpdate.Format("15:04 02/01/2006"),
	}, nil
}

func (s *cartService) DeleteCart(ctx context.Context, cartID string) error {
	cart, err := s.cartRepo.FindCartByID(ctx, cartID)
	if err != nil {
		return fmt.Errorf("failed to find cart: %w", err)
	}
	if cart == nil {
		return ErrCartNotFound
	}
	return s.cartRepo.DeleteCart(ctx, cartID)
}
