package initialize

import (
	"github.com/gofiber/fiber/v3"
	"gorm.io/gorm"
)

// InitRoutes đăng ký toàn bộ route của ứng dụng vào Fiber app.
func InitRoutes(app *fiber.App, db *gorm.DB) {
	api := app.Group("/api")

	// Health check
	api.Get("/health", func(c fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok"})
	})

	// TODO: đăng ký các route theo từng domain (users, products, orders, ...)
	_ = db
}
