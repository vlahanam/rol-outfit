package controllers

import (
	"errors"
	"fmt"
	"log/slog"

	"github.com/gofiber/fiber/v3"
	"github.com/vlahanam/rol-outfit/src/internal/common"
	"github.com/vlahanam/rol-outfit/src/internal/dto"
	"github.com/vlahanam/rol-outfit/src/internal/i18n"
	"github.com/vlahanam/rol-outfit/src/internal/repositories"
	"github.com/vlahanam/rol-outfit/src/internal/requests"
	"github.com/vlahanam/rol-outfit/src/internal/services"
	"gorm.io/gorm"
)

func newCartService(db *gorm.DB) services.CartService {
	repo := repositories.NewPostgreSQLStorage(db)
	return services.NewCartService(repo, repo, repo, repo)
}

func newAdminCartService(db *gorm.DB) services.CartService {
	repo := repositories.NewPostgreSQLStorage(db)
	return services.NewCartServiceWithUserRepo(repo, repo, repo, repo, repo)
}

func userIDFromLocals(ctx fiber.Ctx) (string, error) {
	raw := ctx.Locals("userID")
	if raw == nil {
		return "", fmt.Errorf("userID not found in context")
	}
	id, ok := raw.(string)
	if !ok {
		return "", fmt.Errorf("userID is not a string")
	}
	return id, nil
}

// GetCart GET /api/v1/cart
func GetCart(db *gorm.DB) fiber.Handler {
	return func(ctx fiber.Ctx) error {
		userID, err := userIDFromLocals(ctx)
		if err != nil {
			return ctx.Status(fiber.StatusUnauthorized).JSON(common.ErrUnauthorized)
		}

		svc := newCartService(db)
		cart, items, err := svc.GetCart(ctx.Context(), userID)
		if err != nil {
			slog.Error("GetCart failed", "error", err)
			return ctx.Status(fiber.StatusInternalServerError).JSON(common.ErrInternalServerError)
		}
		return ctx.JSON(common.ResponseData(dto.ToCartDTO(cart, items)))
	}
}

// AddCartItem POST /api/v1/cart/items
func AddCartItem(db *gorm.DB) fiber.Handler {
	return func(ctx fiber.Ctx) error {
		lang := i18n.LangFromHeader(ctx.Get("Accept-Language"))
		userID, err := userIDFromLocals(ctx)
		if err != nil {
			return ctx.Status(fiber.StatusUnauthorized).JSON(common.ErrUnauthorized)
		}

		var req requests.AddCartItemRequest
		if err := ctx.Bind().JSON(&req); err != nil {
			return ctx.Status(fiber.StatusBadRequest).JSON(
				common.ErrBadRequest.WithReason(i18n.T(lang, "error.invalid_payload")),
			)
		}
		if err := req.Validate(); err != nil {
			details := common.ParseValidationErrors(err, lang)
			resp := common.ErrBadRequest.WithReason(i18n.T(lang, "validation.failed"))
			if details != nil {
				resp = resp.WithDetails(details)
			}
			return ctx.Status(fiber.StatusBadRequest).JSON(resp)
		}

		svc := newCartService(db)
		item, err := svc.AddItem(ctx.Context(), userID, &req)
		if err != nil {
			if errors.Is(err, services.ErrProductNotFound) {
				return ctx.Status(fiber.StatusNotFound).JSON(
					common.ErrNotFound.WithReason(i18n.T(lang, "error.product_not_found")),
				)
			}
			slog.Error("AddCartItem failed", "error", err)
			return ctx.Status(fiber.StatusInternalServerError).JSON(common.ErrInternalServerError)
		}
		return ctx.Status(fiber.StatusCreated).JSON(common.ResponseData(dto.ToCartItemDTO(item)))
	}
}

// UpdateCartItem PUT /api/v1/cart/items/:itemID
func UpdateCartItem(db *gorm.DB) fiber.Handler {
	return func(ctx fiber.Ctx) error {
		lang := i18n.LangFromHeader(ctx.Get("Accept-Language"))
		userID, err := userIDFromLocals(ctx)
		if err != nil {
			return ctx.Status(fiber.StatusUnauthorized).JSON(common.ErrUnauthorized)
		}
		itemID := ctx.Params("itemID")

		var req requests.UpdateCartItemRequest
		if err := ctx.Bind().JSON(&req); err != nil {
			return ctx.Status(fiber.StatusBadRequest).JSON(
				common.ErrBadRequest.WithReason(i18n.T(lang, "error.invalid_payload")),
			)
		}
		if err := req.Validate(); err != nil {
			details := common.ParseValidationErrors(err, lang)
			resp := common.ErrBadRequest.WithReason(i18n.T(lang, "validation.failed"))
			if details != nil {
				resp = resp.WithDetails(details)
			}
			return ctx.Status(fiber.StatusBadRequest).JSON(resp)
		}

		svc := newCartService(db)
		if err := svc.UpdateItem(ctx.Context(), userID, itemID, &req); err != nil {
			if errors.Is(err, services.ErrCartItemNotFound) {
				return ctx.Status(fiber.StatusNotFound).JSON(
					common.ErrNotFound.WithReason(i18n.T(lang, "error.cart_item_not_found")),
				)
			}
			if errors.Is(err, services.ErrCartItemNotOwned) {
				return ctx.Status(fiber.StatusForbidden).JSON(
					common.ErrForbidden.WithReason(i18n.T(lang, "error.cart_item_not_owned")),
				)
			}
			slog.Error("UpdateCartItem failed", "error", err)
			return ctx.Status(fiber.StatusInternalServerError).JSON(common.ErrInternalServerError)
		}
		return ctx.SendStatus(fiber.StatusNoContent)
	}
}

// RemoveCartItem DELETE /api/v1/cart/items/:itemID
func RemoveCartItem(db *gorm.DB) fiber.Handler {
	return func(ctx fiber.Ctx) error {
		lang := i18n.LangFromHeader(ctx.Get("Accept-Language"))
		userID, err := userIDFromLocals(ctx)
		if err != nil {
			return ctx.Status(fiber.StatusUnauthorized).JSON(common.ErrUnauthorized)
		}
		itemID := ctx.Params("itemID")

		svc := newCartService(db)
		if err := svc.RemoveItem(ctx.Context(), userID, itemID); err != nil {
			if errors.Is(err, services.ErrCartItemNotFound) {
				return ctx.Status(fiber.StatusNotFound).JSON(
					common.ErrNotFound.WithReason(i18n.T(lang, "error.cart_item_not_found")),
				)
			}
			if errors.Is(err, services.ErrCartItemNotOwned) {
				return ctx.Status(fiber.StatusForbidden).JSON(
					common.ErrForbidden.WithReason(i18n.T(lang, "error.cart_item_not_owned")),
				)
			}
			slog.Error("RemoveCartItem failed", "error", err)
			return ctx.Status(fiber.StatusInternalServerError).JSON(common.ErrInternalServerError)
		}
		return ctx.SendStatus(fiber.StatusNoContent)
	}
}

// AdminListCarts GET /api/v1/admin/carts
func AdminListCarts(db *gorm.DB) fiber.Handler {
	return func(ctx fiber.Ctx) error {
		var p common.Paging
		if err := ctx.Bind().Query(&p); err != nil {
			p = common.Paging{}
		}
		p.Process()
		offset := (p.Page - 1) * p.Limit
		search := ctx.Query("search", "")

		svc := newAdminCartService(db)
		carts, total, err := svc.ListAllCarts(ctx.Context(), offset, p.Limit, search)
		if err != nil {
			slog.Error("AdminListCarts failed", "error", err)
			return ctx.Status(fiber.StatusInternalServerError).JSON(common.ErrInternalServerError)
		}

		p.Total = total
		return ctx.JSON(common.SuccessResponse(carts, p, nil))
	}
}

// AdminGetCart GET /api/v1/admin/carts/:id
func AdminGetCart(db *gorm.DB) fiber.Handler {
	return func(ctx fiber.Ctx) error {
		lang := i18n.LangFromHeader(ctx.Get("Accept-Language"))
		id := ctx.Params("id")

		svc := newAdminCartService(db)
		cart, err := svc.GetCartByID(ctx.Context(), id)
		if err != nil {
			if errors.Is(err, services.ErrCartNotFound) {
				return ctx.Status(fiber.StatusNotFound).JSON(
					common.ErrNotFound.WithReason(i18n.T(lang, "error.cart_not_found")),
				)
			}
			slog.Error("AdminGetCart failed", "error", err)
			return ctx.Status(fiber.StatusInternalServerError).JSON(common.ErrInternalServerError)
		}
		return ctx.JSON(common.ResponseData(cart))
	}
}

// AdminDeleteCart DELETE /api/v1/admin/carts/:id
func AdminDeleteCart(db *gorm.DB) fiber.Handler {
	return func(ctx fiber.Ctx) error {
		lang := i18n.LangFromHeader(ctx.Get("Accept-Language"))
		id := ctx.Params("id")

		svc := newAdminCartService(db)
		if err := svc.DeleteCart(ctx.Context(), id); err != nil {
			if errors.Is(err, services.ErrCartNotFound) {
				return ctx.Status(fiber.StatusNotFound).JSON(
					common.ErrNotFound.WithReason(i18n.T(lang, "error.cart_not_found")),
				)
			}
			slog.Error("AdminDeleteCart failed", "error", err)
			return ctx.Status(fiber.StatusInternalServerError).JSON(common.ErrInternalServerError)
		}
		return ctx.SendStatus(fiber.StatusNoContent)
	}
}
