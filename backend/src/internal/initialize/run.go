package initialize

import (
	"context"
	"log"
	"log/slog"
	"time"

	"github.com/gofiber/fiber/v3"
	"github.com/vlahanam/rol-outfit/src/internal/repositories"
	"github.com/vlahanam/rol-outfit/src/internal/services"
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

	// Email service (used for order notifications and bill reminder cronjob)
	emailSvc := services.NewEmailService(
		cfg.SmtpHost, cfg.SmtpPort, cfg.SmtpUser, cfg.SmtpPassword,
		cfg.SmtpFromEmail, cfg.AdminEmail,
	)

	// Start daily bill upload reminder (10:00 JST)
	StartBillReminderScheduler(db, cfg, emailSvc)

	app := fiber.New()
	InitRoutes(app, db, cfg, emailSvc)

	log.Printf("server khởi động tại cổng %s", cfg.AppPort)
	log.Fatal(app.Listen(":" + cfg.AppPort))
}
