package main

import (
	"log"

	"github.com/vlahanam/rol-outfit/src/internal/initialize"
	"github.com/vlahanam/rol-outfit/src/internal/seeder"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func main() {
	cfg := initialize.LoadConfig()
	db := initialize.InitDB(cfg)
	// Suppress SQL-level logging to avoid bcrypt hashes appearing in compose logs
	db = db.Session(&gorm.Session{Logger: db.Logger.LogMode(logger.Warn)})

	if err := seeder.RunAll(db); err != nil {
		log.Fatalf("seed thất bại: %v", err)
	}
	log.Println("seed hoàn tất")
}
