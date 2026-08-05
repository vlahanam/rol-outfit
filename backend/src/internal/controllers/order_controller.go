package controllers

import (
	"errors"
	"fmt"
	"log/slog"

	"github.com/gofiber/fiber/v3"
	"github.com/vlahanam/rol-outfit/src/internal/common"
	"github.com/vlahanam/rol-outfit/src/internal/dto"
	"github.com/vlahanam/rol-outfit/src/internal/i18n"
	"github.com/vlahanam/rol-outfit/src/internal/models"
	"github.com/vlahanam/rol-outfit/src/internal/repositories"
	"github.com/vlahanam/rol-outfit/src/internal/requests"
	"github.com/vlahanam/rol-outfit/src/internal/services"
	"gorm.io/gorm"
)

func newOrderService(db *gorm.DB) services.OrderService {
	repo := repositories.NewPostgreSQLStorage(db)
	return services.NewOrderService(db, repo, repo, repo, repo, repo)
}

// CreateOrder POST /api/v1/orders
func CreateOrder(db *gorm.DB, emailSvc services.EmailService, adminURL string) fiber.Handler {
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

		go func() {
			if err := emailSvc.SendNewOrderNotification(order, items, adminURL); err != nil {
				slog.Error("failed to send order notification email", "error", err, "order_code", order.OrderCode)
			}
		}()

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

// UpdateOrderShipping PUT /api/v1/orders/:id/shipping
func UpdateOrderShipping(db *gorm.DB) fiber.Handler {
	return func(ctx fiber.Ctx) error {
		lang := i18n.LangFromHeader(ctx.Get("Accept-Language"))
		userID, err := userIDFromLocals(ctx)
		if err != nil {
			return ctx.Status(fiber.StatusUnauthorized).JSON(common.ErrUnauthorized)
		}
		orderID := ctx.Params("id")

		var req requests.UpdateOrderShippingRequest
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
		if err := svc.UpdateShippingInfo(ctx.Context(), userID, orderID, &req); err != nil {
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
			if errors.Is(err, services.ErrCannotUpdateShipping) {
				return ctx.Status(fiber.StatusConflict).JSON(
					common.ErrConflict.WithReason(i18n.T(lang, "error.cannot_update_shipping")),
				)
			}
			slog.Error("UpdateOrderShipping failed", "error", err)
			return ctx.Status(fiber.StatusInternalServerError).JSON(common.ErrInternalServerError)
		}
		return ctx.SendStatus(fiber.StatusNoContent)
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

		var req requests.CancelOrderRequest
		if len(ctx.Body()) > 0 {
			if err := ctx.Bind().JSON(&req); err != nil {
				return ctx.Status(fiber.StatusBadRequest).JSON(
					common.ErrBadRequest.WithReason(i18n.T(lang, "error.invalid_payload")),
				)
			}
		}

		svc := newOrderService(db)
		if err := svc.CancelOrder(ctx.Context(), userID, orderID, req.Reason, false); err != nil {
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
			if errors.Is(err, services.ErrReasonRequired) {
				return ctx.Status(fiber.StatusBadRequest).JSON(
					common.ErrBadRequest.WithReason(i18n.T(lang, "error.reason_required")),
				)
			}
			slog.Error("CancelOrder failed", "error", err)
			return ctx.Status(fiber.StatusInternalServerError).JSON(common.ErrInternalServerError)
		}
		return ctx.SendStatus(fiber.StatusNoContent)
	}
}

// UploadOrderBill POST /api/v1/orders/:id/bill — upload bank transfer bill
func UploadOrderBill(db *gorm.DB, svc services.UploadService, maxSize int64) fiber.Handler {
	return func(ctx fiber.Ctx) error {
		lang := i18n.LangFromHeader(ctx.Get("Accept-Language"))
		userID, err := userIDFromLocals(ctx)
		if err != nil {
			return ctx.Status(fiber.StatusUnauthorized).JSON(common.ErrUnauthorized)
		}
		orderID := ctx.Params("id")

		fh, err := ctx.FormFile("file")
		if err != nil {
			return ctx.Status(fiber.StatusBadRequest).JSON(
				common.ErrBadRequest.WithReason(i18n.T(lang, "error.file_required")),
			)
		}

		result, err := svc.Save(ctx.Context(), fh, maxSize, "order", orderID, nil)
		if err != nil {
			switch {
			case errors.Is(err, services.ErrFileTooBig):
				return ctx.Status(fiber.StatusRequestEntityTooLarge).JSON(
					common.ErrBadRequest.WithReason(i18n.T(lang, "error.file_too_large")),
				)
			case errors.Is(err, services.ErrFileTypeNotAllow):
				return ctx.Status(fiber.StatusUnprocessableEntity).JSON(
					common.ErrBadRequest.WithReason(i18n.T(lang, "error.file_type_not_allowed")),
				)
			default:
				slog.Error("UploadOrderBill: save failed", "error", err)
				return ctx.Status(fiber.StatusInternalServerError).JSON(common.ErrInternalServerError)
			}
		}

		orderSvc := newOrderService(db)
		if err := orderSvc.UploadBill(ctx.Context(), userID, orderID, result.URL); err != nil {
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
			if errors.Is(err, services.ErrCannotUploadBill) {
				return ctx.Status(fiber.StatusConflict).JSON(
					common.ErrConflict.WithReason(i18n.T(lang, "error.cannot_upload_bill")),
				)
			}
			slog.Error("UploadOrderBill: upload failed", "error", err)
			return ctx.Status(fiber.StatusInternalServerError).JSON(common.ErrInternalServerError)
		}

		keepKeys := svc.ExtractKeys(result.URL)
		if err := svc.DeleteUnusedForModel(ctx.Context(), "order", orderID, keepKeys); err != nil {
			slog.Warn("UploadOrderBill: failed to delete old bill uploads", "order_id", orderID, "error", err)
		}

		return ctx.JSON(common.ResponseData(result))
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

		userIDs := make([]string, 0, len(orders))
		seen := make(map[string]bool)
		for _, o := range orders {
			if !seen[o.UserID] {
				userIDs = append(userIDs, o.UserID)
				seen[o.UserID] = true
			}
		}

		repo := repositories.NewPostgreSQLStorage(db)
		userMap, err := repo.FindByIDs(ctx.Context(), userIDs)
		if err != nil {
			slog.Error("ListAllOrders: failed to fetch users", "error", err)
			userMap = make(map[string]*models.User)
		}

		result := make([]*dto.AdminOrderDTO, 0, len(orders))
		for _, o := range orders {
			result = append(result, dto.ToAdminOrderDTO(o, nil, userMap[o.UserID]))
		}
		p.Total = total
		return ctx.JSON(common.SuccessResponse(result, p, nil))
	}
}

// GetAdminOrder GET /api/v1/admin/orders/:id [admin]
func GetAdminOrder(db *gorm.DB) fiber.Handler {
	return func(ctx fiber.Ctx) error {
		lang := i18n.LangFromHeader(ctx.Get("Accept-Language"))
		orderID := ctx.Params("id")

		svc := newOrderService(db)
		order, items, err := svc.GetOrder(ctx.Context(), "", orderID, true)
		if err != nil {
			if errors.Is(err, services.ErrOrderNotFound) {
				return ctx.Status(fiber.StatusNotFound).JSON(
					common.ErrNotFound.WithReason(i18n.T(lang, "error.order_not_found")),
				)
			}
			slog.Error("GetAdminOrder failed", "error", err)
			return ctx.Status(fiber.StatusInternalServerError).JSON(common.ErrInternalServerError)
		}

		repo := repositories.NewPostgreSQLStorage(db)
		user, err := repo.FindByID(ctx.Context(), order.UserID)
		if err != nil {
			slog.Error("GetAdminOrder: failed to fetch user", "error", err, "user_id", order.UserID)
		}

		return ctx.JSON(common.ResponseData(dto.ToAdminOrderDTO(order, items, user)))
	}
}

// UpdateOrderStatus PUT /api/v1/admin/orders/:id/status [admin]
func UpdateOrderStatus(db *gorm.DB) fiber.Handler {
	return func(ctx fiber.Ctx) error {
		lang := i18n.LangFromHeader(ctx.Get("Accept-Language"))
		adminID, _ := userIDFromLocals(ctx)
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
		if err := svc.UpdateStatus(ctx.Context(), orderID, req.Status, adminID, req.Note); err != nil {
			if errors.Is(err, services.ErrOrderNotFound) {
				return ctx.Status(fiber.StatusNotFound).JSON(
					common.ErrNotFound.WithReason(i18n.T(lang, "error.order_not_found")),
				)
			}
			if errors.Is(err, services.ErrInvalidTransition) {
				return ctx.Status(fiber.StatusConflict).JSON(
					common.ErrConflict.WithReason(i18n.T(lang, "error.invalid_transition")),
				)
			}
			slog.Error("UpdateOrderStatus failed", "error", err)
			return ctx.Status(fiber.StatusInternalServerError).JSON(common.ErrInternalServerError)
		}
		return ctx.SendStatus(fiber.StatusNoContent)
	}
}

// RequestRefund POST /api/v1/orders/:id/refund
func RequestRefund(db *gorm.DB) fiber.Handler {
	return func(ctx fiber.Ctx) error {
		lang := i18n.LangFromHeader(ctx.Get("Accept-Language"))
		userID, err := userIDFromLocals(ctx)
		if err != nil {
			return ctx.Status(fiber.StatusUnauthorized).JSON(common.ErrUnauthorized)
		}
		orderID := ctx.Params("id")

		var req requests.RefundRequest
		if err := ctx.Bind().JSON(&req); err != nil {
			req = requests.RefundRequest{}
		}

		svc := newOrderService(db)
		if err := svc.RequestRefund(ctx.Context(), userID, orderID, req.Reason); err != nil {
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
			if errors.Is(err, services.ErrCannotRequestRefund) {
				return ctx.Status(fiber.StatusConflict).JSON(
					common.ErrConflict.WithReason(i18n.T(lang, "error.cannot_request_refund")),
				)
			}
			slog.Error("RequestRefund failed", "error", err)
			return ctx.Status(fiber.StatusInternalServerError).JSON(common.ErrInternalServerError)
		}
		return ctx.JSON(common.ResponseData(fiber.Map{"message": "Refund requested"}))
	}
}

// GetOrderHistory GET /api/v1/orders/:id/history
func GetOrderHistory(db *gorm.DB, isAdmin bool) fiber.Handler {
	return func(ctx fiber.Ctx) error {
		lang := i18n.LangFromHeader(ctx.Get("Accept-Language"))
		userID, err := userIDFromLocals(ctx)
		if err != nil && !isAdmin {
			return ctx.Status(fiber.StatusUnauthorized).JSON(common.ErrUnauthorized)
		}
		orderID := ctx.Params("id")

		svc := newOrderService(db)

		// Verify order access
		_, _, err = svc.GetOrder(ctx.Context(), userID, orderID, isAdmin)
		if err != nil {
			if errors.Is(err, services.ErrOrderNotFound) {
				return ctx.Status(fiber.StatusNotFound).JSON(
					common.ErrNotFound.WithReason(i18n.T(lang, "error.order_not_found")),
				)
			}
			if errors.Is(err, services.ErrOrderNotOwned) {
				return ctx.Status(fiber.StatusForbidden).JSON(common.ErrForbidden)
			}
			return ctx.Status(fiber.StatusInternalServerError).JSON(common.ErrInternalServerError)
		}

		history, err := svc.GetOrderHistory(ctx.Context(), orderID)
		if err != nil {
			slog.Error("GetOrderHistory failed", "error", err)
			return ctx.Status(fiber.StatusInternalServerError).JSON(common.ErrInternalServerError)
		}

		result := make([]*dto.OrderStatusHistoryDTO, len(history))
		for i, h := range history {
			result[i] = dto.ToOrderStatusHistoryDTO(h)
		}
		return ctx.JSON(common.ResponseData(result))
	}
}

// ApproveRefund PUT /api/v1/admin/orders/:id/approve-refund
func ApproveRefund(db *gorm.DB) fiber.Handler {
	return func(ctx fiber.Ctx) error {
		lang := i18n.LangFromHeader(ctx.Get("Accept-Language"))
		adminID, _ := userIDFromLocals(ctx)
		orderID := ctx.Params("id")

		svc := newOrderService(db)
		if err := svc.ApproveRefund(ctx.Context(), orderID, adminID); err != nil {
			if errors.Is(err, services.ErrOrderNotFound) {
				return ctx.Status(fiber.StatusNotFound).JSON(
					common.ErrNotFound.WithReason(i18n.T(lang, "error.order_not_found")),
				)
			}
			if errors.Is(err, services.ErrNotRefundRequest) {
				return ctx.Status(fiber.StatusConflict).JSON(
					common.ErrConflict.WithReason(i18n.T(lang, "error.not_refund_request")),
				)
			}
			slog.Error("ApproveRefund failed", "error", err)
			return ctx.Status(fiber.StatusInternalServerError).JSON(common.ErrInternalServerError)
		}
		return ctx.SendStatus(fiber.StatusNoContent)
	}
}

// RejectRefund PUT /api/v1/admin/orders/:id/reject-refund
func RejectRefund(db *gorm.DB) fiber.Handler {
	return func(ctx fiber.Ctx) error {
		lang := i18n.LangFromHeader(ctx.Get("Accept-Language"))
		adminID, _ := userIDFromLocals(ctx)
		orderID := ctx.Params("id")

		var req requests.RejectRefundRequest
		if err := ctx.Bind().JSON(&req); err != nil {
			return ctx.Status(fiber.StatusBadRequest).JSON(
				common.ErrBadRequest.WithReason(i18n.T(lang, "error.invalid_payload")),
			)
		}
		if err := req.Validate(); err != nil {
			return ctx.Status(fiber.StatusBadRequest).JSON(
				common.ErrBadRequest.WithReason(i18n.T(lang, "validation.failed")),
			)
		}

		svc := newOrderService(db)
		if err := svc.RejectRefund(ctx.Context(), orderID, adminID, req.Reason); err != nil {
			if errors.Is(err, services.ErrOrderNotFound) {
				return ctx.Status(fiber.StatusNotFound).JSON(
					common.ErrNotFound.WithReason(i18n.T(lang, "error.order_not_found")),
				)
			}
			if errors.Is(err, services.ErrNotRefundRequest) {
				return ctx.Status(fiber.StatusConflict).JSON(
					common.ErrConflict.WithReason(i18n.T(lang, "error.not_refund_request")),
				)
			}
			slog.Error("RejectRefund failed", "error", err)
			return ctx.Status(fiber.StatusInternalServerError).JSON(common.ErrInternalServerError)
		}
		return ctx.SendStatus(fiber.StatusNoContent)
	}
}

// AdminRefundCancelledOrder PUT /api/v1/admin/orders/:id/refund-cancelled
func AdminRefundCancelledOrder(db *gorm.DB) fiber.Handler {
	return func(ctx fiber.Ctx) error {
		lang := i18n.LangFromHeader(ctx.Get("Accept-Language"))
		adminID, _ := userIDFromLocals(ctx)
		orderID := ctx.Params("id")

		svc := newOrderService(db)
		if err := svc.RefundCancelledOrder(ctx.Context(), orderID, adminID); err != nil {
			if errors.Is(err, services.ErrOrderNotFound) {
				return ctx.Status(fiber.StatusNotFound).JSON(
					common.ErrNotFound.WithReason(i18n.T(lang, "error.order_not_found")),
				)
			}
			if errors.Is(err, services.ErrInvalidTransition) {
				return ctx.Status(fiber.StatusConflict).JSON(
					common.ErrConflict.WithReason(i18n.T(lang, "error.invalid_status_transition")),
				)
			}
			slog.Error("AdminRefundCancelledOrder failed", "error", err)
			return ctx.Status(fiber.StatusInternalServerError).JSON(common.ErrInternalServerError)
		}
		return ctx.JSON(fiber.Map{"message": "Order refunded successfully"})
	}
}
