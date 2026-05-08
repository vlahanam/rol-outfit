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

// ListTags GET /api/v1/tags (public — active only)
func ListTags(db *gorm.DB) fiber.Handler {
	return func(ctx fiber.Ctx) error {
		var p common.Paging
		if err := ctx.Bind().Query(&p); err != nil {
			p = common.Paging{}
		}
		p.Process()
		offset := (p.Page - 1) * p.Limit

		svc := services.NewTagService(repositories.NewPostgreSQLStorage(db))
		tags, total, err := svc.List(ctx.Context(), offset, p.Limit)
		if err != nil {
			slog.Error("ListTags failed", "error", err)
			return ctx.Status(fiber.StatusInternalServerError).JSON(common.ErrInternalServerError)
		}
		result := make([]*dto.TagDTO, 0, len(tags))
		for _, t := range tags {
			result = append(result, dto.ToTagDTO(t))
		}
		p.Total = total
		return ctx.JSON(common.SuccessResponse(result, p, nil))
	}
}

// GetTag GET /api/v1/tags/:id (public — active only)
func GetTag(db *gorm.DB) fiber.Handler {
	return func(ctx fiber.Ctx) error {
		lang := i18n.LangFromHeader(ctx.Get("Accept-Language"))
		id := ctx.Params("id")
		if _, err := uuid.Parse(id); err != nil {
			return ctx.Status(fiber.StatusBadRequest).JSON(common.ErrBadRequest.WithReason(i18n.T(lang, "error.invalid_id")))
		}
		svc := services.NewTagService(repositories.NewPostgreSQLStorage(db))
		t, err := svc.GetByID(ctx.Context(), id)
		if err != nil {
			if errors.Is(err, services.ErrTagNotFound) {
				return ctx.Status(fiber.StatusNotFound).JSON(common.ErrNotFound.WithReason(i18n.T(lang, "error.tag_not_found")))
			}
			slog.Error("GetTag failed", "error", err)
			return ctx.Status(fiber.StatusInternalServerError).JSON(common.ErrInternalServerError)
		}
		return ctx.JSON(common.ResponseData(dto.ToTagDTO(t)))
	}
}

// AdminListTags GET /api/v1/admin/tags (admin — all tags)
func AdminListTags(db *gorm.DB) fiber.Handler {
	return func(ctx fiber.Ctx) error {
		var p common.Paging
		if err := ctx.Bind().Query(&p); err != nil {
			p = common.Paging{}
		}
		p.Process()
		offset := (p.Page - 1) * p.Limit

		svc := services.NewTagService(repositories.NewPostgreSQLStorage(db))
		tags, total, err := svc.ListAdmin(ctx.Context(), offset, p.Limit)
		if err != nil {
			slog.Error("AdminListTags failed", "error", err)
			return ctx.Status(fiber.StatusInternalServerError).JSON(common.ErrInternalServerError)
		}
		result := make([]*dto.TagDTO, 0, len(tags))
		for _, t := range tags {
			result = append(result, dto.ToTagDTO(t))
		}
		p.Total = total
		return ctx.JSON(common.SuccessResponse(result, p, nil))
	}
}

// AdminGetTag GET /api/v1/admin/tags/:id (admin — any tag)
func AdminGetTag(db *gorm.DB) fiber.Handler {
	return func(ctx fiber.Ctx) error {
		lang := i18n.LangFromHeader(ctx.Get("Accept-Language"))
		id := ctx.Params("id")
		if _, err := uuid.Parse(id); err != nil {
			return ctx.Status(fiber.StatusBadRequest).JSON(common.ErrBadRequest.WithReason(i18n.T(lang, "error.invalid_id")))
		}
		svc := services.NewTagService(repositories.NewPostgreSQLStorage(db))
		t, err := svc.GetByIDAdmin(ctx.Context(), id)
		if err != nil {
			if errors.Is(err, services.ErrTagNotFound) {
				return ctx.Status(fiber.StatusNotFound).JSON(common.ErrNotFound.WithReason(i18n.T(lang, "error.tag_not_found")))
			}
			slog.Error("AdminGetTag failed", "error", err)
			return ctx.Status(fiber.StatusInternalServerError).JSON(common.ErrInternalServerError)
		}
		return ctx.JSON(common.ResponseData(dto.ToTagDTO(t)))
	}
}

// CreateTag POST /api/v1/tags (admin)
func CreateTag(db *gorm.DB) fiber.Handler {
	return func(ctx fiber.Ctx) error {
		lang := i18n.LangFromHeader(ctx.Get("Accept-Language"))
		var req requests.CreateTagRequest
		if err := ctx.Bind().JSON(&req); err != nil {
			return ctx.Status(fiber.StatusBadRequest).JSON(common.ErrBadRequest.WithReason(i18n.T(lang, "error.invalid_payload")))
		}
		if err := req.Validate(); err != nil {
			details := common.ParseValidationErrors(err, lang)
			resp := common.ErrBadRequest.WithReason(i18n.T(lang, "validation.failed"))
			if details != nil {
				resp = resp.WithDetails(details)
			}
			return ctx.Status(fiber.StatusBadRequest).JSON(resp)
		}
		svc := services.NewTagService(repositories.NewPostgreSQLStorage(db))
		t, err := svc.Create(ctx.Context(), &req)
		if err != nil {
			if errors.Is(err, services.ErrTagSlugTaken) {
				return ctx.Status(fiber.StatusConflict).JSON(common.ErrConflict.WithReason(i18n.T(lang, "error.tag_slug_taken")))
			}
			if errors.Is(err, services.ErrTagInvalidWindow) {
				return ctx.Status(fiber.StatusBadRequest).JSON(common.ErrBadRequest.WithReason(i18n.T(lang, "error.tag_invalid_window")))
			}
			slog.Error("CreateTag failed", "error", err)
			return ctx.Status(fiber.StatusInternalServerError).JSON(common.ErrInternalServerError)
		}
		return ctx.Status(fiber.StatusCreated).JSON(common.ResponseData(dto.ToTagDTO(t)))
	}
}

// UpdateTag PUT /api/v1/tags/:id (admin)
func UpdateTag(db *gorm.DB) fiber.Handler {
	return func(ctx fiber.Ctx) error {
		lang := i18n.LangFromHeader(ctx.Get("Accept-Language"))
		id := ctx.Params("id")
		if _, err := uuid.Parse(id); err != nil {
			return ctx.Status(fiber.StatusBadRequest).JSON(common.ErrBadRequest.WithReason(i18n.T(lang, "error.invalid_id")))
		}
		var req requests.UpdateTagRequest
		if err := ctx.Bind().JSON(&req); err != nil {
			return ctx.Status(fiber.StatusBadRequest).JSON(common.ErrBadRequest.WithReason(i18n.T(lang, "error.invalid_payload")))
		}
		if err := req.Validate(); err != nil {
			details := common.ParseValidationErrors(err, lang)
			resp := common.ErrBadRequest.WithReason(i18n.T(lang, "validation.failed"))
			if details != nil {
				resp = resp.WithDetails(details)
			}
			return ctx.Status(fiber.StatusBadRequest).JSON(resp)
		}
		svc := services.NewTagService(repositories.NewPostgreSQLStorage(db))
		if err := svc.Update(ctx.Context(), id, &req); err != nil {
			if errors.Is(err, services.ErrTagNotFound) {
				return ctx.Status(fiber.StatusNotFound).JSON(common.ErrNotFound.WithReason(i18n.T(lang, "error.tag_not_found")))
			}
			if errors.Is(err, services.ErrTagSlugTaken) {
				return ctx.Status(fiber.StatusConflict).JSON(common.ErrConflict.WithReason(i18n.T(lang, "error.tag_slug_taken")))
			}
			if errors.Is(err, services.ErrTagInvalidWindow) {
				return ctx.Status(fiber.StatusBadRequest).JSON(common.ErrBadRequest.WithReason(i18n.T(lang, "error.tag_invalid_window")))
			}
			slog.Error("UpdateTag failed", "error", err)
			return ctx.Status(fiber.StatusInternalServerError).JSON(common.ErrInternalServerError)
		}
		return ctx.SendStatus(fiber.StatusNoContent)
	}
}

// DeleteTag DELETE /api/v1/tags/:id (admin)
func DeleteTag(db *gorm.DB) fiber.Handler {
	return func(ctx fiber.Ctx) error {
		lang := i18n.LangFromHeader(ctx.Get("Accept-Language"))
		id := ctx.Params("id")
		if _, err := uuid.Parse(id); err != nil {
			return ctx.Status(fiber.StatusBadRequest).JSON(common.ErrBadRequest.WithReason(i18n.T(lang, "error.invalid_id")))
		}
		svc := services.NewTagService(repositories.NewPostgreSQLStorage(db))
		if err := svc.Delete(ctx.Context(), id); err != nil {
			if errors.Is(err, services.ErrTagNotFound) {
				return ctx.Status(fiber.StatusNotFound).JSON(common.ErrNotFound.WithReason(i18n.T(lang, "error.tag_not_found")))
			}
			slog.Error("DeleteTag failed", "error", err)
			return ctx.Status(fiber.StatusInternalServerError).JSON(common.ErrInternalServerError)
		}
		return ctx.SendStatus(fiber.StatusNoContent)
	}
}
