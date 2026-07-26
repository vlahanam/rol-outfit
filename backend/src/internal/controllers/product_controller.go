package controllers

import (
	"errors"
	"log/slog"
	"strings"

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

func productServiceFromDB(db *gorm.DB) services.ProductService {
	repo := repositories.NewPostgreSQLStorage(db)
	return services.NewProductService(repo, repo)
}

// ListProducts GET /api/v1/products?category_id=&search=&tags=&tag=&sort=&product_type=&page=&limit=
func ListProducts(db *gorm.DB) fiber.Handler {
	return func(ctx fiber.Ctx) error {
		var p common.Paging
		if err := ctx.Bind().Query(&p); err != nil {
			p = common.Paging{}
		}
		p.Process()
		categoryID := ctx.Query("category_id")
		search := ctx.Query("search")
		sortMode := ctx.Query("sort")
		offset := (p.Page - 1) * p.Limit

		var productType int8
		if pt := ctx.Query("product_type"); pt != "" {
			if pt == "1" {
				productType = 1
			} else if pt == "2" {
				productType = 2
			}
		}

		var tagSlugs []string
		if tagsParam := ctx.Query("tags"); tagsParam != "" {
			for _, s := range strings.Split(tagsParam, ",") {
				if trimmed := strings.TrimSpace(s); trimmed != "" {
					tagSlugs = append(tagSlugs, trimmed)
				}
			}
		}
		if singleTag := ctx.Query("tag"); singleTag != "" && len(tagSlugs) == 0 {
			tagSlugs = []string{singleTag}
		}

		svc := productServiceFromDB(db)

		products, total, err := svc.List(ctx.Context(), categoryID, search, tagSlugs, sortMode, productType, offset, p.Limit)
		if err != nil {
			slog.Error("ListProducts failed", "error", err)
			return ctx.Status(fiber.StatusInternalServerError).JSON(common.ErrInternalServerError)
		}

		lang := i18n.LangFromHeader(ctx.Get("Accept-Language"))
		result := make([]*dto.LocalizedProductDTO, 0, len(products))
		for _, p := range products {
			result = append(result, dto.ToProductDTO(p).ToLocalized(lang))
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
		svc := productServiceFromDB(db)

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

		tagSvc := services.NewProductTagService(repo, repo, repo)
		tags, err := tagSvc.GetActiveTags(ctx.Context(), id)
		if err != nil {
			slog.Error("GetProduct tags failed", "error", err)
			tags = nil
		}
		return ctx.JSON(common.ResponseData(dto.ToProductDetailDTO(p, tags).ToLocalized(lang)))
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

		svc := productServiceFromDB(db)

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

		if _, err := uuid.Parse(id); err != nil {
			return ctx.Status(fiber.StatusBadRequest).JSON(
				common.ErrBadRequest.WithReason(i18n.T(lang, "error.invalid_id")),
			)
		}

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

		svc := productServiceFromDB(db)

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

		if _, err := uuid.Parse(id); err != nil {
			return ctx.Status(fiber.StatusBadRequest).JSON(
				common.ErrBadRequest.WithReason(i18n.T(lang, "error.invalid_id")),
			)
		}

		svc := productServiceFromDB(db)

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

// AdminGetProduct GET /api/v1/admin/products/:id [admin]
func AdminGetProduct(db *gorm.DB) fiber.Handler {
	return func(ctx fiber.Ctx) error {
		lang := i18n.LangFromHeader(ctx.Get("Accept-Language"))
		id := ctx.Params("id")

		if _, err := uuid.Parse(id); err != nil {
			return ctx.Status(fiber.StatusBadRequest).JSON(
				common.ErrBadRequest.WithReason(i18n.T(lang, "error.invalid_id")),
			)
		}

		repo := repositories.NewPostgreSQLStorage(db)
		svc := productServiceFromDB(db)

		pw, err := svc.AdminGetByID(ctx.Context(), id)
		if err != nil {
			if errors.Is(err, services.ErrProductNotFound) {
				return ctx.Status(fiber.StatusNotFound).JSON(
					common.ErrNotFound.WithReason(i18n.T(lang, "error.product_not_found")),
				)
			}
			slog.Error("AdminGetProduct failed", "error", err)
			return ctx.Status(fiber.StatusInternalServerError).JSON(common.ErrInternalServerError)
		}

		tagSvc := services.NewProductTagService(repo, repo, repo)
		tags, err := tagSvc.GetAllTags(ctx.Context(), id)
		if err != nil {
			slog.Error("AdminGetProduct tags failed", "error", err)
			tags = nil
		}
		return ctx.JSON(common.ResponseData(dto.ToProductWithVariantsDTOWithTags(pw, tags)))
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

		svc := productServiceFromDB(db)

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
