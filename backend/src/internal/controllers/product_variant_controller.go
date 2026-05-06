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

// ListVariants GET /api/v1/products/:productID/variants?page=&limit=
func ListVariants(db *gorm.DB) fiber.Handler {
	return func(ctx fiber.Ctx) error {
		lang := i18n.LangFromHeader(ctx.Get("Accept-Language"))
		productID := ctx.Params("productID")
		if _, err := uuid.Parse(productID); err != nil {
			return ctx.Status(fiber.StatusBadRequest).JSON(
				common.ErrBadRequest.WithReason(i18n.T(lang, "error.invalid_id")),
			)
		}

		var p common.Paging
		if err := ctx.Bind().Query(&p); err != nil {
			p = common.Paging{}
		}
		p.Process()
		offset := (p.Page - 1) * p.Limit

		repo := repositories.NewPostgreSQLStorage(db)
		svc := services.NewProductVariantService(repo, repo)

		variants, total, err := svc.List(ctx.Context(), productID, offset, p.Limit)
		if err != nil {
			slog.Error("ListVariants failed", "error", err)
			return ctx.Status(fiber.StatusInternalServerError).JSON(common.ErrInternalServerError)
		}

		result := make([]*dto.ProductVariantDTO, 0, len(variants))
		for _, v := range variants {
			result = append(result, dto.ToVariantDTO(v))
		}
		p.Total = total
		return ctx.JSON(common.SuccessResponse(result, p, nil))
	}
}

// GetVariant GET /api/v1/products/:productID/variants/:id
func GetVariant(db *gorm.DB) fiber.Handler {
	return func(ctx fiber.Ctx) error {
		lang := i18n.LangFromHeader(ctx.Get("Accept-Language"))
		productID := ctx.Params("productID")
		id := ctx.Params("id")

		for _, s := range []string{productID, id} {
			if _, err := uuid.Parse(s); err != nil {
				return ctx.Status(fiber.StatusBadRequest).JSON(
					common.ErrBadRequest.WithReason(i18n.T(lang, "error.invalid_id")),
				)
			}
		}

		repo := repositories.NewPostgreSQLStorage(db)
		svc := services.NewProductVariantService(repo, repo)

		v, err := svc.GetByID(ctx.Context(), productID, id)
		if err != nil {
			if errors.Is(err, services.ErrVariantNotFound) || errors.Is(err, services.ErrVariantForbidden) {
				return ctx.Status(fiber.StatusNotFound).JSON(
					common.ErrNotFound.WithReason(i18n.T(lang, "error.variant_not_found")),
				)
			}
			slog.Error("GetVariant failed", "error", err)
			return ctx.Status(fiber.StatusInternalServerError).JSON(common.ErrInternalServerError)
		}
		return ctx.JSON(common.ResponseData(dto.ToVariantDTO(v)))
	}
}

// CreateVariant POST /api/v1/products/:productID/variants [admin]
func CreateVariant(db *gorm.DB) fiber.Handler {
	return func(ctx fiber.Ctx) error {
		lang := i18n.LangFromHeader(ctx.Get("Accept-Language"))
		productID := ctx.Params("productID")
		if _, err := uuid.Parse(productID); err != nil {
			return ctx.Status(fiber.StatusBadRequest).JSON(
				common.ErrBadRequest.WithReason(i18n.T(lang, "error.invalid_id")),
			)
		}

		var req requests.CreateVariantRequest
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
		svc := services.NewProductVariantService(repo, repo)

		v, err := svc.Create(ctx.Context(), productID, &req)
		if err != nil {
			if errors.Is(err, services.ErrVariantAttributesMismatch) {
				return ctx.Status(fiber.StatusBadRequest).JSON(
					common.ErrBadRequest.WithReason(i18n.T(lang, "error.variant_attributes_mismatch")),
				)
			}
			slog.Error("CreateVariant failed", "error", err)
			return ctx.Status(fiber.StatusInternalServerError).JSON(common.ErrInternalServerError)
		}
		return ctx.Status(fiber.StatusCreated).JSON(common.ResponseData(dto.ToVariantDTO(v)))
	}
}

// UpdateVariant PUT /api/v1/products/:productID/variants/:id [admin]
func UpdateVariant(db *gorm.DB) fiber.Handler {
	return func(ctx fiber.Ctx) error {
		lang := i18n.LangFromHeader(ctx.Get("Accept-Language"))
		productID := ctx.Params("productID")
		id := ctx.Params("id")

		for _, s := range []string{productID, id} {
			if _, err := uuid.Parse(s); err != nil {
				return ctx.Status(fiber.StatusBadRequest).JSON(
					common.ErrBadRequest.WithReason(i18n.T(lang, "error.invalid_id")),
				)
			}
		}

		var req requests.UpdateVariantRequest
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
		svc := services.NewProductVariantService(repo, repo)

		if err := svc.Update(ctx.Context(), productID, id, &req); err != nil {
			if errors.Is(err, services.ErrVariantNotFound) || errors.Is(err, services.ErrVariantForbidden) {
				return ctx.Status(fiber.StatusNotFound).JSON(
					common.ErrNotFound.WithReason(i18n.T(lang, "error.variant_not_found")),
				)
			}
			if errors.Is(err, services.ErrVariantAttributesMismatch) {
				return ctx.Status(fiber.StatusBadRequest).JSON(
					common.ErrBadRequest.WithReason(i18n.T(lang, "error.variant_attributes_mismatch")),
				)
			}
			slog.Error("UpdateVariant failed", "error", err)
			return ctx.Status(fiber.StatusInternalServerError).JSON(common.ErrInternalServerError)
		}
		return ctx.SendStatus(fiber.StatusNoContent)
	}
}

// DeleteVariant DELETE /api/v1/products/:productID/variants/:id [admin]
func DeleteVariant(db *gorm.DB) fiber.Handler {
	return func(ctx fiber.Ctx) error {
		lang := i18n.LangFromHeader(ctx.Get("Accept-Language"))
		productID := ctx.Params("productID")
		id := ctx.Params("id")

		for _, s := range []string{productID, id} {
			if _, err := uuid.Parse(s); err != nil {
				return ctx.Status(fiber.StatusBadRequest).JSON(
					common.ErrBadRequest.WithReason(i18n.T(lang, "error.invalid_id")),
				)
			}
		}

		repo := repositories.NewPostgreSQLStorage(db)
		svc := services.NewProductVariantService(repo, repo)

		if err := svc.Delete(ctx.Context(), productID, id); err != nil {
			if errors.Is(err, services.ErrVariantNotFound) || errors.Is(err, services.ErrVariantForbidden) {
				return ctx.Status(fiber.StatusNotFound).JSON(
					common.ErrNotFound.WithReason(i18n.T(lang, "error.variant_not_found")),
				)
			}
			slog.Error("DeleteVariant failed", "error", err)
			return ctx.Status(fiber.StatusInternalServerError).JSON(common.ErrInternalServerError)
		}
		return ctx.SendStatus(fiber.StatusNoContent)
	}
}
