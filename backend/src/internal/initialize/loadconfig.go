package initialize

import (
	"fmt"
	"os"
	"strconv"
)

// AppConfig chứa toàn bộ cấu hình ứng dụng được nạp từ biến môi trường.
type AppConfig struct {
	AppPort        string
	DBHost         string
	DBPort         string
	DBUser         string
	DBPassword     string
	DBName         string
	MigrationsPath string
	JWTSecret      string
	UploadDir      string
	UploadURL      string
	UploadMaxSize  int64
}

// DSN trả về chuỗi kết nối PostgreSQL cho GORM.
func (c *AppConfig) DSN() string {
	return fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=disable TimeZone=Asia/Ho_Chi_Minh",
		c.DBHost, c.DBPort, c.DBUser, c.DBPassword, c.DBName,
	)
}

// MigrateURL trả về URL kết nối dùng cho golang-migrate (pgx driver).
func (c *AppConfig) MigrateURL() string {
	return fmt.Sprintf(
		"pgx5://%s:%s@%s:%s/%s?sslmode=disable",
		c.DBUser, c.DBPassword, c.DBHost, c.DBPort, c.DBName,
	)
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func getEnvInt64(key string, fallback int64) int64 {
	if v := os.Getenv(key); v != "" {
		if n, err := strconv.ParseInt(v, 10, 64); err == nil {
			return n
		}
	}
	return fallback
}

// LoadConfig nạp cấu hình từ biến môi trường với giá trị mặc định hợp lý.
func LoadConfig() *AppConfig {
	return &AppConfig{
		AppPort:        getEnv("APP_PORT", "8080"),
		DBHost:         getEnv("DB_HOST", "localhost"),
		DBPort:         getEnv("DB_PORT", "5432"),
		DBUser:         getEnv("DB_USER", ""),
		DBPassword:     getEnv("DB_PASSWORD", ""),
		DBName:         getEnv("DB_NAME", ""),
		MigrationsPath: getEnv("MIGRATIONS_PATH", "database/migrations"),
		JWTSecret:      getEnv("JWT_SECRET", "change-me-in-production"),
		UploadDir:      getEnv("UPLOAD_DIR", "/app/uploads"),
		UploadURL:      getEnv("UPLOAD_URL", "/uploads"),
		UploadMaxSize:  getEnvInt64("UPLOAD_MAX_SIZE", 10*1024*1024), // default 10 MB
	}
}
