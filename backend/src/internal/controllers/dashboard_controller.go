package controllers

import (
	"log/slog"

	"github.com/gofiber/fiber/v3"
	"github.com/vlahanam/rol-outfit/src/internal/common"
	"github.com/vlahanam/rol-outfit/src/internal/services"
	"gorm.io/gorm"
)

// GetDashboardStats GET /api/v1/admin/dashboard — returns dashboard statistics
func GetDashboardStats(db *gorm.DB) fiber.Handler {
	return func(ctx fiber.Ctx) error {
		svc := services.NewDashboardService(db)

		stats, err := svc.GetStats(ctx.Context())
		if err != nil {
			slog.Error("GetDashboardStats failed", "error", err)
			return ctx.Status(fiber.StatusInternalServerError).JSON(common.ErrInternalServerError)
		}

		return ctx.JSON(common.ResponseData(stats))
	}
}
