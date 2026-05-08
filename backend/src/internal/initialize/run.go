package initialize

import (
	"context"
	"log"
	"log/slog"
	"time"

	"github.com/gofiber/fiber/v3"
	"github.com/vlahanam/rol-outfit/src/internal/repositories"
)

func Run() {
	cfg := LoadConfig()

	RunMigrations(cfg)

	db := InitDB(cfg)

	// Start cleanup goroutine for expired refresh tokens
	repo := repositories.NewPostgreSQLStorage(db)
	go func() {
		ticker := time.NewTicker(6 * time.Hour)
		defer ticker.Stop()
		for range ticker.C {
			if err := repo.DeleteExpiredRefreshTokens(context.Background()); err != nil {
				slog.Error("refresh token cleanup failed", "error", err)
			}
		}
	}()

	app := fiber.New()
	InitRoutes(app, db, cfg)

	log.Printf("server khởi động tại cổng %s", cfg.AppPort)
	log.Fatal(app.Listen(":" + cfg.AppPort))
}
