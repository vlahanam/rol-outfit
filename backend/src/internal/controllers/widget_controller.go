package controllers

import (
	"errors"
	"log/slog"

	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"
	"github.com/vlahanam/rol-outfit/src/internal/common"
	"github.com/vlahanam/rol-outfit/src/internal/dto"
	"github.com/vlahanam/rol-outfit/src/internal/i18n"
	"github.com/vlahanam/rol-outfit/src/internal/repositories"
	"github.com/vlahanam/rol-outfit/src/internal/requests"
	"github.com/vlahanam/rol-outfit/src/internal/services"
	"gorm.io/gorm"
)

// AdminListWidgets GET /api/v1/admin/widgets [admin]
func AdminListWidgets(db *gorm.DB) fiber.Handler {
	return func(ctx fiber.Ctx) error {
		var p common.Paging
		if err := ctx.Bind().Query(&p); err != nil {
			p = common.Paging{}
		}
		p.Process()
		offset := (p.Page - 1) * p.Limit

		var parentID *string
		if raw := ctx.Query("parent_id"); raw != "" {
			if _, err := uuid.Parse(raw); err != nil {
				lang := i18n.LangFromHeader(ctx.Get("Accept-Language"))
				return ctx.Status(fiber.StatusBadRequest).JSON(
					common.ErrBadRequest.WithReason(i18n.T(lang, "error.invalid_id")),
				)
			}
			parentID = &raw
		}

		repo := repositories.NewPostgreSQLStorage(db)
		svc := services.NewWidgetService(repo)

		widgets, total, err := svc.ListAdmin(ctx.Context(), parentID, offset, p.Limit)
		if err != nil {
			slog.Error("AdminListWidgets failed", "error", err)
			return ctx.Status(fiber.StatusInternalServerError).JSON(common.ErrInternalServerError)
		}

		result := make([]*dto.WidgetDTO, 0, len(widgets))
		for _, w := range widgets {
			result = append(result, dto.ToWidgetDTO(w))
		}
		p.Total = total
		return ctx.JSON(common.SuccessResponse(result, p, nil))
	}
}

// AdminGetWidget GET /api/v1/admin/widgets/:id [admin]
func AdminGetWidget(db *gorm.DB) fiber.Handler {
	return func(ctx fiber.Ctx) error {
		lang := i18n.LangFromHeader(ctx.Get("Accept-Language"))
		id := ctx.Params("id")

		if _, err := uuid.Parse(id); err != nil {
			return ctx.Status(fiber.StatusBadRequest).JSON(
				common.ErrBadRequest.WithReason(i18n.T(lang, "error.invalid_id")),
			)
		}

		repo := repositories.NewPostgreSQLStorage(db)
		svc := services.NewWidgetService(repo)

		w, err := svc.GetByIDAdmin(ctx.Context(), id)
		if err != nil {
			if errors.Is(err, services.ErrWidgetNotFound) {
				return ctx.Status(fiber.StatusNotFound).JSON(
					common.ErrNotFound.WithReason(i18n.T(lang, "error.widget_not_found")),
				)
			}
			slog.Error("AdminGetWidget failed", "error", err)
			return ctx.Status(fiber.StatusInternalServerError).JSON(common.ErrInternalServerError)
		}
		return ctx.JSON(common.ResponseData(dto.ToWidgetDTO(w)))
	}
}

// ListWidgets GET /api/v1/widgets?parent_id=<uuid>
func ListWidgets(db *gorm.DB) fiber.Handler {
	return func(ctx fiber.Ctx) error {
		var p common.Paging
		if err := ctx.Bind().Query(&p); err != nil {
			p = common.Paging{}
		}
		p.Process()
		offset := (p.Page - 1) * p.Limit

		var parentID *string
		if raw := ctx.Query("parent_id"); raw != "" {
			if _, err := uuid.Parse(raw); err != nil {
				lang := i18n.LangFromHeader(ctx.Get("Accept-Language"))
				return ctx.Status(fiber.StatusBadRequest).JSON(
					common.ErrBadRequest.WithReason(i18n.T(lang, "error.invalid_id")),
				)
			}
			parentID = &raw
		}

		repo := repositories.NewPostgreSQLStorage(db)
		svc := services.NewWidgetService(repo)

		widgets, total, err := svc.List(ctx.Context(), parentID, offset, p.Limit)
		if err != nil {
			slog.Error("ListWidgets failed", "error", err)
			return ctx.Status(fiber.StatusInternalServerError).JSON(common.ErrInternalServerError)
		}

		result := make([]*dto.WidgetDTO, 0, len(widgets))
		for _, w := range widgets {
			result = append(result, dto.ToWidgetDTO(w))
		}
		p.Total = total
		return ctx.JSON(common.SuccessResponse(result, p, nil))
	}
}

// GetWidget GET /api/v1/widgets/:id
func GetWidget(db *gorm.DB) fiber.Handler {
	return func(ctx fiber.Ctx) error {
		lang := i18n.LangFromHeader(ctx.Get("Accept-Language"))
		id := ctx.Params("id")

		if _, err := uuid.Parse(id); err != nil {
			return ctx.Status(fiber.StatusBadRequest).JSON(
				common.ErrBadRequest.WithReason(i18n.T(lang, "error.invalid_id")),
			)
		}

		repo := repositories.NewPostgreSQLStorage(db)
		svc := services.NewWidgetService(repo)

		w, err := svc.GetByID(ctx.Context(), id)
		if err != nil {
			if errors.Is(err, services.ErrWidgetNotFound) {
				return ctx.Status(fiber.StatusNotFound).JSON(
					common.ErrNotFound.WithReason(i18n.T(lang, "error.widget_not_found")),
				)
			}
			slog.Error("GetWidget failed", "error", err)
			return ctx.Status(fiber.StatusInternalServerError).JSON(common.ErrInternalServerError)
		}
		return ctx.JSON(common.ResponseData(dto.ToWidgetDTO(w)))
	}
}

// CreateWidget POST /api/v1/widgets [admin]
func CreateWidget(db *gorm.DB) fiber.Handler {
	return func(ctx fiber.Ctx) error {
		lang := i18n.LangFromHeader(ctx.Get("Accept-Language"))

		var req requests.CreateWidgetRequest
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

		// Validate parent_id format if provided
		if req.ParentID != nil {
			if _, err := uuid.Parse(*req.ParentID); err != nil {
				return ctx.Status(fiber.StatusBadRequest).JSON(
					common.ErrBadRequest.WithReason(i18n.T(lang, "error.invalid_id")),
				)
			}
		}

		repo := repositories.NewPostgreSQLStorage(db)
		svc := services.NewWidgetService(repo)

		w, err := svc.Create(ctx.Context(), &req)
		if err != nil {
			if errors.Is(err, services.ErrWidgetNotFound) {
				return ctx.Status(fiber.StatusNotFound).JSON(
					common.ErrNotFound.WithReason(i18n.T(lang, "error.widget_not_found")),
				)
			}
			slog.Error("CreateWidget failed", "error", err)
			return ctx.Status(fiber.StatusInternalServerError).JSON(common.ErrInternalServerError)
		}
		return ctx.Status(fiber.StatusCreated).JSON(common.ResponseData(dto.ToWidgetDTO(w)))
	}
}

// UpdateWidget PUT /api/v1/widgets/:id [admin]
func UpdateWidget(db *gorm.DB) fiber.Handler {
	return func(ctx fiber.Ctx) error {
		lang := i18n.LangFromHeader(ctx.Get("Accept-Language"))
		id := ctx.Params("id")

		if _, err := uuid.Parse(id); err != nil {
			return ctx.Status(fiber.StatusBadRequest).JSON(
				common.ErrBadRequest.WithReason(i18n.T(lang, "error.invalid_id")),
			)
		}

		var req requests.UpdateWidgetRequest
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

		repo := repositories.NewPostgreSQLStorage(db)
		svc := services.NewWidgetService(repo)

		if err := svc.Update(ctx.Context(), id, &req); err != nil {
			if errors.Is(err, services.ErrWidgetNotFound) {
				return ctx.Status(fiber.StatusNotFound).JSON(
					common.ErrNotFound.WithReason(i18n.T(lang, "error.widget_not_found")),
				)
			}
			slog.Error("UpdateWidget failed", "error", err)
			return ctx.Status(fiber.StatusInternalServerError).JSON(common.ErrInternalServerError)
		}
		return ctx.JSON(common.ResponseData(fiber.Map{"updated": true}))
	}
}

// DeleteWidget DELETE /api/v1/widgets/:id [admin]
func DeleteWidget(db *gorm.DB) fiber.Handler {
	return func(ctx fiber.Ctx) error {
		lang := i18n.LangFromHeader(ctx.Get("Accept-Language"))
		id := ctx.Params("id")

		if _, err := uuid.Parse(id); err != nil {
			return ctx.Status(fiber.StatusBadRequest).JSON(
				common.ErrBadRequest.WithReason(i18n.T(lang, "error.invalid_id")),
			)
		}

		repo := repositories.NewPostgreSQLStorage(db)
		svc := services.NewWidgetService(repo)

		if err := svc.Delete(ctx.Context(), id); err != nil {
			if errors.Is(err, services.ErrWidgetNotFound) {
				return ctx.Status(fiber.StatusNotFound).JSON(
					common.ErrNotFound.WithReason(i18n.T(lang, "error.widget_not_found")),
				)
			}
			slog.Error("DeleteWidget failed", "error", err)
			return ctx.Status(fiber.StatusInternalServerError).JSON(common.ErrInternalServerError)
		}
		return ctx.JSON(common.ResponseData(fiber.Map{"deleted": true}))
	}
}
