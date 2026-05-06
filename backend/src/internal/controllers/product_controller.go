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

// ListProducts GET /api/v1/products?category_id=&page=&limit=
func ListProducts(db *gorm.DB) fiber.Handler {
	return func(ctx fiber.Ctx) error {
		var p common.Paging
		if err := ctx.Bind().Query(&p); err != nil {
			p = common.Paging{}
		}
		p.Process()
		categoryID := ctx.Query("category_id")
		offset := (p.Page - 1) * p.Limit

		repo := repositories.NewPostgreSQLStorage(db)
		svc := services.NewProductService(repo)

		products, total, err := svc.List(ctx.Context(), categoryID, offset, p.Limit)
		if err != nil {
			slog.Error("ListProducts failed", "error", err)
			return ctx.Status(fiber.StatusInternalServerError).JSON(common.ErrInternalServerError)
		}

		result := make([]*dto.ProductDTO, 0, len(products))
		for _, p := range products {
			result = append(result, dto.ToProductDTO(p))
		}
		p.Total = total
		return ctx.JSON(common.SuccessResponse(result, p, nil))
	}
}

// GetProduct GET /api/v1/products/:id
func GetProduct(db *gorm.DB) fiber.Handler {
	return func(ctx fiber.Ctx) error {
		lang := i18n.LangFromHeader(ctx.Get("Accept-Language"))
		id := ctx.Params("id")

		if _, err := uuid.Parse(id); err != nil {
			return ctx.Status(fiber.StatusBadRequest).JSON(
				common.ErrBadRequest.WithReason(i18n.T(lang, "error.invalid_id")),
			)
		}

		repo := repositories.NewPostgreSQLStorage(db)
		svc := services.NewProductService(repo)

		p, err := svc.GetByID(ctx.Context(), id)
		if err != nil {
			if errors.Is(err, services.ErrProductNotFound) {
				return ctx.Status(fiber.StatusNotFound).JSON(
					common.ErrNotFound.WithReason(i18n.T(lang, "error.product_not_found")),
				)
			}
			slog.Error("GetProduct failed", "error", err)
			return ctx.Status(fiber.StatusInternalServerError).JSON(common.ErrInternalServerError)
		}
		return ctx.JSON(common.ResponseData(dto.ToProductDTO(p)))
	}
}

// CreateProduct POST /api/v1/products [admin]
func CreateProduct(db *gorm.DB) fiber.Handler {
	return func(ctx fiber.Ctx) error {
		lang := i18n.LangFromHeader(ctx.Get("Accept-Language"))

		var req requests.CreateProductRequest
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
		svc := services.NewProductService(repo)

		p, err := svc.Create(ctx.Context(), &req)
		if err != nil {
			if errors.Is(err, services.ErrProductSlugTaken) {
				return ctx.Status(fiber.StatusConflict).JSON(
					common.ErrConflict.WithReason(i18n.T(lang, "error.product_slug_taken")),
				)
			}
			slog.Error("CreateProduct failed", "error", err)
			return ctx.Status(fiber.StatusInternalServerError).JSON(common.ErrInternalServerError)
		}
		return ctx.Status(fiber.StatusCreated).JSON(common.ResponseData(dto.ToProductDTO(p)))
	}
}

// UpdateProduct PUT /api/v1/products/:id [admin]
func UpdateProduct(db *gorm.DB) fiber.Handler {
	return func(ctx fiber.Ctx) error {
		lang := i18n.LangFromHeader(ctx.Get("Accept-Language"))
		id := ctx.Params("id")

		var req requests.UpdateProductRequest
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
		svc := services.NewProductService(repo)

		if err := svc.Update(ctx.Context(), id, &req); err != nil {
			if errors.Is(err, services.ErrProductNotFound) {
				return ctx.Status(fiber.StatusNotFound).JSON(
					common.ErrNotFound.WithReason(i18n.T(lang, "error.product_not_found")),
				)
			}
			if errors.Is(err, services.ErrProductSlugTaken) {
				return ctx.Status(fiber.StatusConflict).JSON(
					common.ErrConflict.WithReason(i18n.T(lang, "error.product_slug_taken")),
				)
			}
			slog.Error("UpdateProduct failed", "error", err)
			return ctx.Status(fiber.StatusInternalServerError).JSON(common.ErrInternalServerError)
		}
		return ctx.SendStatus(fiber.StatusNoContent)
	}
}

// DeleteProduct DELETE /api/v1/products/:id [admin]
func DeleteProduct(db *gorm.DB) fiber.Handler {
	return func(ctx fiber.Ctx) error {
		lang := i18n.LangFromHeader(ctx.Get("Accept-Language"))
		id := ctx.Params("id")

		repo := repositories.NewPostgreSQLStorage(db)
		svc := services.NewProductService(repo)

		if err := svc.Delete(ctx.Context(), id); err != nil {
			if errors.Is(err, services.ErrProductNotFound) {
				return ctx.Status(fiber.StatusNotFound).JSON(
					common.ErrNotFound.WithReason(i18n.T(lang, "error.product_not_found")),
				)
			}
			slog.Error("DeleteProduct failed", "error", err)
			return ctx.Status(fiber.StatusInternalServerError).JSON(common.ErrInternalServerError)
		}
		return ctx.SendStatus(fiber.StatusNoContent)
	}
}

// AdminListProducts GET /api/v1/admin/products?category_id=&search=&page=&limit= [admin]
// Returns products with their variants, aggregated stock/sold totals, suitable for admin management.
func AdminListProducts(db *gorm.DB) fiber.Handler {
	return func(ctx fiber.Ctx) error {
		var p common.Paging
		if err := ctx.Bind().Query(&p); err != nil {
			p = common.Paging{}
		}
		p.Process()

		categoryID := ctx.Query("category_id")
		search := ctx.Query("search")
		offset := (p.Page - 1) * p.Limit

		repo := repositories.NewPostgreSQLStorage(db)
		svc := services.NewProductService(repo)

		products, total, err := svc.AdminList(ctx.Context(), categoryID, search, offset, p.Limit)
		if err != nil {
			slog.Error("AdminListProducts failed", "error", err)
			return ctx.Status(fiber.StatusInternalServerError).JSON(common.ErrInternalServerError)
		}

		result := make([]*dto.ProductWithVariantsDTO, 0, len(products))
		for _, pw := range products {
			result = append(result, dto.ToProductWithVariantsDTO(pw))
		}
		p.Total = total
		return ctx.JSON(common.SuccessResponse(result, p, nil))
	}
}
