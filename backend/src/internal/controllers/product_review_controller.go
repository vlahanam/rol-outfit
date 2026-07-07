package controllers

import (
	"errors"
	"log/slog"
	"strconv"

	"github.com/gofiber/fiber/v3"
	"github.com/vlahanam/rol-outfit/src/internal/common"
	"github.com/vlahanam/rol-outfit/src/internal/i18n"
	"github.com/vlahanam/rol-outfit/src/internal/models"
	"github.com/vlahanam/rol-outfit/src/internal/repositories"
	"github.com/vlahanam/rol-outfit/src/internal/services"
	"gorm.io/gorm"
)

type ReviewResponse struct {
	ID          string `json:"id"`
	ProductID   string `json:"product_id"`
	ProductName string `json:"product_name,omitempty"`
	UserID      string `json:"user_id"`
	UserName    string `json:"user_name"`
	Rating      int8   `json:"rating"`
	Comment     string `json:"comment"`
	Status      int8   `json:"status"`
	CreatedAt   string `json:"created_at"`
}

func toReviewResponse(r *models.ProductReview) ReviewResponse {
	res := ReviewResponse{
		ID:        r.ID,
		ProductID: r.ProductID,
		UserID:    r.UserID,
		Rating:    r.Rating,
		Comment:   r.Comment,
		Status:    r.Status,
		CreatedAt: r.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}
	if r.User != nil {
		res.UserName = r.User.FullName
	}
	if r.Product != nil {
		res.ProductName = r.Product.Name
	}
	return res
}

func ListProductReviews(db *gorm.DB) fiber.Handler {
	return func(ctx fiber.Ctx) error {
		productID := ctx.Params("id")
		page, _ := strconv.Atoi(ctx.Query("page", "1"))
		limit, _ := strconv.Atoi(ctx.Query("limit", "10"))
		if page < 1 {
			page = 1
		}
		if limit < 1 || limit > 50 {
			limit = 10
		}

		repo := repositories.NewPostgreSQLStorage(db)
		svc := services.NewProductReviewService(repo)

		reviews, total, err := svc.ListByProduct(ctx.Context(), productID, page, limit)
		if err != nil {
			slog.Error("ListProductReviews failed", "error", err)
			return ctx.Status(fiber.StatusInternalServerError).JSON(common.ErrInternalServerError)
		}

		var data []ReviewResponse
		for _, r := range reviews {
			data = append(data, toReviewResponse(r))
		}

		return ctx.JSON(common.SuccessResponse(data, map[string]any{
			"page":  page,
			"limit": limit,
			"total": total,
		}, nil))
	}
}

func GetReviewStats(db *gorm.DB) fiber.Handler {
	return func(ctx fiber.Ctx) error {
		productID := ctx.Params("id")

		repo := repositories.NewPostgreSQLStorage(db)
		svc := services.NewProductReviewService(repo)

		stats, err := svc.GetStats(ctx.Context(), productID)
		if err != nil {
			slog.Error("GetReviewStats failed", "error", err)
			return ctx.Status(fiber.StatusInternalServerError).JSON(common.ErrInternalServerError)
		}

		return ctx.JSON(common.ResponseData(stats))
	}
}

func CanUserReview(db *gorm.DB) fiber.Handler {
	return func(ctx fiber.Ctx) error {
		productID := ctx.Params("id")
		userID := ctx.Locals("userID").(string)

		repo := repositories.NewPostgreSQLStorage(db)
		svc := services.NewProductReviewService(repo)

		canReview, reason, err := svc.CanUserReview(ctx.Context(), userID, productID)
		if err != nil {
			slog.Error("CanUserReview failed", "error", err)
			return ctx.Status(fiber.StatusInternalServerError).JSON(common.ErrInternalServerError)
		}

		result := fiber.Map{"can_review": canReview}
		if reason != "" {
			result["reason"] = reason
		}
		return ctx.JSON(common.ResponseData(result))
	}
}

func CreateReview(db *gorm.DB) fiber.Handler {
	return func(ctx fiber.Ctx) error {
		lang := i18n.LangFromHeader(ctx.Get("Accept-Language"))
		productID := ctx.Params("id")
		userID := ctx.Locals("userID").(string)

		var req services.CreateReviewRequest
		if err := ctx.Bind().JSON(&req); err != nil {
			return ctx.Status(fiber.StatusBadRequest).JSON(
				common.ErrBadRequest.WithReason(i18n.T(lang, "error.invalid_payload")),
			)
		}

		repo := repositories.NewPostgreSQLStorage(db)
		svc := services.NewProductReviewService(repo)

		review, err := svc.Create(ctx.Context(), userID, productID, &req)
		if err != nil {
			if errors.Is(err, services.ErrAlreadyReviewed) {
				return ctx.Status(fiber.StatusConflict).JSON(
					common.ErrConflict.WithReason("You have already reviewed this product"),
				)
			}
			if errors.Is(err, services.ErrNotPurchased) {
				return ctx.Status(fiber.StatusForbidden).JSON(
					common.ErrForbidden.WithReason("You must purchase this product before reviewing"),
				)
			}
			if errors.Is(err, services.ErrInvalidRating) {
				return ctx.Status(fiber.StatusBadRequest).JSON(
					common.ErrBadRequest.WithReason("Rating must be between 1 and 5"),
				)
			}
			slog.Error("CreateReview failed", "error", err)
			return ctx.Status(fiber.StatusInternalServerError).JSON(common.ErrInternalServerError)
		}

		return ctx.Status(fiber.StatusCreated).JSON(common.ResponseData(toReviewResponse(review)))
	}
}

func AdminListReviews(db *gorm.DB) fiber.Handler {
	return func(ctx fiber.Ctx) error {
		page, _ := strconv.Atoi(ctx.Query("page", "1"))
		limit, _ := strconv.Atoi(ctx.Query("limit", "20"))
		status, _ := strconv.Atoi(ctx.Query("status", "0"))
		search := ctx.Query("search", "")

		if page < 1 {
			page = 1
		}
		if limit < 1 || limit > 100 {
			limit = 20
		}

		repo := repositories.NewPostgreSQLStorage(db)
		svc := services.NewProductReviewService(repo)

		reviews, total, err := svc.ListAll(ctx.Context(), int8(status), search, page, limit)
		if err != nil {
			slog.Error("AdminListReviews failed", "error", err)
			return ctx.Status(fiber.StatusInternalServerError).JSON(common.ErrInternalServerError)
		}

		var data []ReviewResponse
		for _, r := range reviews {
			data = append(data, toReviewResponse(r))
		}

		return ctx.JSON(common.SuccessResponse(data, map[string]any{
			"page":  page,
			"limit": limit,
			"total": total,
		}, nil))
	}
}

func ApproveReview(db *gorm.DB) fiber.Handler {
	return func(ctx fiber.Ctx) error {
		id := ctx.Params("id")

		repo := repositories.NewPostgreSQLStorage(db)
		svc := services.NewProductReviewService(repo)

		if err := svc.Approve(ctx.Context(), id); err != nil {
			if errors.Is(err, services.ErrReviewNotFound) {
				return ctx.Status(fiber.StatusNotFound).JSON(common.ErrNotFound)
			}
			slog.Error("ApproveReview failed", "error", err)
			return ctx.Status(fiber.StatusInternalServerError).JSON(common.ErrInternalServerError)
		}

		return ctx.JSON(common.ResponseData(fiber.Map{"approved": true}))
	}
}

func RejectReview(db *gorm.DB) fiber.Handler {
	return func(ctx fiber.Ctx) error {
		id := ctx.Params("id")

		repo := repositories.NewPostgreSQLStorage(db)
		svc := services.NewProductReviewService(repo)

		if err := svc.Reject(ctx.Context(), id); err != nil {
			if errors.Is(err, services.ErrReviewNotFound) {
				return ctx.Status(fiber.StatusNotFound).JSON(common.ErrNotFound)
			}
			slog.Error("RejectReview failed", "error", err)
			return ctx.Status(fiber.StatusInternalServerError).JSON(common.ErrInternalServerError)
		}

		return ctx.JSON(common.ResponseData(fiber.Map{"rejected": true}))
	}
}

func DeleteReview(db *gorm.DB) fiber.Handler {
	return func(ctx fiber.Ctx) error {
		id := ctx.Params("id")

		repo := repositories.NewPostgreSQLStorage(db)
		svc := services.NewProductReviewService(repo)

		if err := svc.Delete(ctx.Context(), id); err != nil {
			if errors.Is(err, services.ErrReviewNotFound) {
				return ctx.Status(fiber.StatusNotFound).JSON(common.ErrNotFound)
			}
			slog.Error("DeleteReview failed", "error", err)
			return ctx.Status(fiber.StatusInternalServerError).JSON(common.ErrInternalServerError)
		}

		return ctx.SendStatus(fiber.StatusNoContent)
	}
}
