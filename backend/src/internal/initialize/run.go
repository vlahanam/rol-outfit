package initialize

import (
	"log"

	"github.com/gofiber/fiber/v3"
)

func Run() {
	cfg := LoadConfig()

	RunMigrations(cfg)

	db := InitDB(cfg)

	app := fiber.New()
	InitRoutes(app, db, cfg)

	log.Printf("server khởi động tại cổng %s", cfg.AppPort)
	log.Fatal(app.Listen(":" + cfg.AppPort))
}
