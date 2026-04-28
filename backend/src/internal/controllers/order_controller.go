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

func newOrderService(db *gorm.DB) services.OrderService {
	repo := repositories.NewPostgreSQLStorage(db)
	return services.NewOrderService(db, repo, repo, repo, repo)
}

// CreateOrder POST /api/v1/orders
func CreateOrder(db *gorm.DB) fiber.Handler {
	return func(ctx fiber.Ctx) error {
		lang := i18n.LangFromHeader(ctx.Get("Accept-Language"))
		userID, err := userIDFromLocals(ctx)
		if err != nil {
			return ctx.Status(fiber.StatusUnauthorized).JSON(common.ErrUnauthorized)
		}

		var req requests.CreateOrderRequest
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

		svc := newOrderService(db)
		order, items, err := svc.CreateFromCart(ctx.Context(), userID, &req)
		if err != nil {
			if errors.Is(err, services.ErrCartEmpty) {
				return ctx.Status(fiber.StatusBadRequest).JSON(
					common.ErrBadRequest.WithReason(i18n.T(lang, "error.cart_empty")),
				)
			}
			slog.Error("CreateOrder failed", "error", err)
			return ctx.Status(fiber.StatusInternalServerError).JSON(common.ErrInternalServerError)
		}
		return ctx.Status(fiber.StatusCreated).JSON(common.ResponseData(dto.ToOrderDTO(order, items)))
	}
}

// ListOrders GET /api/v1/orders — user's own orders
func ListOrders(db *gorm.DB) fiber.Handler {
	return func(ctx fiber.Ctx) error {
		userID, err := userIDFromLocals(ctx)
		if err != nil {
			return ctx.Status(fiber.StatusUnauthorized).JSON(common.ErrUnauthorized)
		}

		var p common.Paging
		if err := ctx.Bind().Query(&p); err != nil {
			p = common.Paging{}
		}
		p.Process()
		offset := (p.Page - 1) * p.Limit

		svc := newOrderService(db)
		orders, total, err := svc.ListUserOrders(ctx.Context(), userID, offset, p.Limit)
		if err != nil {
			slog.Error("ListOrders failed", "error", err)
			return ctx.Status(fiber.StatusInternalServerError).JSON(common.ErrInternalServerError)
		}

		result := make([]*dto.OrderDTO, 0, len(orders))
		for _, o := range orders {
			result = append(result, dto.ToOrderDTO(o, nil))
		}
		p.Total = total
		return ctx.JSON(common.SuccessResponse(result, p, nil))
	}
}

// GetOrder GET /api/v1/orders/:id
func GetOrder(db *gorm.DB) fiber.Handler {
	return func(ctx fiber.Ctx) error {
		lang := i18n.LangFromHeader(ctx.Get("Accept-Language"))
		userID, err := userIDFromLocals(ctx)
		if err != nil {
			return ctx.Status(fiber.StatusUnauthorized).JSON(common.ErrUnauthorized)
		}
		orderID := ctx.Params("id")

		svc := newOrderService(db)
		order, items, err := svc.GetOrder(ctx.Context(), userID, orderID, false)
		if err != nil {
			if errors.Is(err, services.ErrOrderNotFound) {
				return ctx.Status(fiber.StatusNotFound).JSON(
					common.ErrNotFound.WithReason(i18n.T(lang, "error.order_not_found")),
				)
			}
			if errors.Is(err, services.ErrOrderNotOwned) {
				return ctx.Status(fiber.StatusForbidden).JSON(
					common.ErrForbidden.WithReason(i18n.T(lang, "error.order_not_owned")),
				)
			}
			slog.Error("GetOrder failed", "error", err)
			return ctx.Status(fiber.StatusInternalServerError).JSON(common.ErrInternalServerError)
		}
		return ctx.JSON(common.ResponseData(dto.ToOrderDTO(order, items)))
	}
}

// CancelOrder DELETE /api/v1/orders/:id
func CancelOrder(db *gorm.DB) fiber.Handler {
	return func(ctx fiber.Ctx) error {
		lang := i18n.LangFromHeader(ctx.Get("Accept-Language"))
		userID, err := userIDFromLocals(ctx)
		if err != nil {
			return ctx.Status(fiber.StatusUnauthorized).JSON(common.ErrUnauthorized)
		}
		orderID := ctx.Params("id")

		svc := newOrderService(db)
		if err := svc.CancelOrder(ctx.Context(), userID, orderID); err != nil {
			if errors.Is(err, services.ErrOrderNotFound) {
				return ctx.Status(fiber.StatusNotFound).JSON(
					common.ErrNotFound.WithReason(i18n.T(lang, "error.order_not_found")),
				)
			}
			if errors.Is(err, services.ErrOrderNotOwned) {
				return ctx.Status(fiber.StatusForbidden).JSON(
					common.ErrForbidden.WithReason(i18n.T(lang, "error.order_not_owned")),
				)
			}
			if errors.Is(err, services.ErrCannotCancel) {
				return ctx.Status(fiber.StatusConflict).JSON(
					common.ErrConflict.WithReason(i18n.T(lang, "error.cannot_cancel")),
				)
			}
			slog.Error("CancelOrder failed", "error", err)
			return ctx.Status(fiber.StatusInternalServerError).JSON(common.ErrInternalServerError)
		}
		return ctx.SendStatus(fiber.StatusNoContent)
	}
}

// ListAllOrders GET /api/v1/admin/orders?status=&page=&limit= [admin]
func ListAllOrders(db *gorm.DB) fiber.Handler {
	return func(ctx fiber.Ctx) error {
		var p common.Paging
		if err := ctx.Bind().Query(&p); err != nil {
			p = common.Paging{}
		}
		p.Process()
		statusStr := ctx.Query("status", "0")
		var statusVal int
		fmt.Sscanf(statusStr, "%d", &statusVal)
		status := int8(statusVal)
		offset := (p.Page - 1) * p.Limit

		svc := newOrderService(db)
		orders, total, err := svc.ListAllOrders(ctx.Context(), status, offset, p.Limit)
		if err != nil {
			slog.Error("ListAllOrders failed", "error", err)
			return ctx.Status(fiber.StatusInternalServerError).JSON(common.ErrInternalServerError)
		}

		result := make([]*dto.OrderDTO, 0, len(orders))
		for _, o := range orders {
			result = append(result, dto.ToOrderDTO(o, nil))
		}
		p.Total = total
		return ctx.JSON(common.SuccessResponse(result, p, nil))
	}
}

// UpdateOrderStatus PUT /api/v1/admin/orders/:id/status [admin]
func UpdateOrderStatus(db *gorm.DB) fiber.Handler {
	return func(ctx fiber.Ctx) error {
		lang := i18n.LangFromHeader(ctx.Get("Accept-Language"))
		orderID := ctx.Params("id")

		var req requests.UpdateOrderStatusRequest
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

		svc := newOrderService(db)
		if err := svc.UpdateStatus(ctx.Context(), orderID, req.Status); err != nil {
			if errors.Is(err, services.ErrOrderNotFound) {
				return ctx.Status(fiber.StatusNotFound).JSON(
					common.ErrNotFound.WithReason(i18n.T(lang, "error.order_not_found")),
				)
			}
			slog.Error("UpdateOrderStatus failed", "error", err)
			return ctx.Status(fiber.StatusInternalServerError).JSON(common.ErrInternalServerError)
		}
		return ctx.SendStatus(fiber.StatusNoContent)
	}
}
