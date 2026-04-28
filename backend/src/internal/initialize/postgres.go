package initialize

import (
	"fmt"
	"log"
	"time"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/pgx/v5"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// InitDB khởi tạo kết nối GORM với PostgreSQL và cấu hình connection pool.
func InitDB(cfg *AppConfig) *gorm.DB {
	db, err := gorm.Open(postgres.Open(cfg.DSN()), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		log.Fatalf("không thể kết nối database: %v", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		log.Fatalf("không thể lấy sql.DB từ gorm: %v", err)
	}
	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(100)
	sqlDB.SetConnMaxLifetime(time.Hour)

	log.Println("kết nối database thành công")
	return db
}

// RunMigrations chạy toàn bộ migration chưa áp dụng từ thư mục migrations.
func RunMigrations(cfg *AppConfig) {
	sourceURL := fmt.Sprintf("file://%s", cfg.MigrationsPath)

	m, err := migrate.New(sourceURL, cfg.MigrateURL())
	if err != nil {
		log.Fatalf("khởi tạo migrate thất bại: %v", err)
	}
	defer m.Close()

	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		log.Fatalf("migration thất bại: %v", err)
	}

	log.Println("migration áp dụng thành công")
}
