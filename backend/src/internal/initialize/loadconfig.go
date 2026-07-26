package initialize

import (
	"fmt"
	"os"
	"strconv"
	"strings"
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
	UploadDriver   string

	// OAuth
	GoogleClientID        string
	GoogleClientSecret    string
	OAuthAllowedRedirects []string
	OAuthCallbackBaseURL  string

	// AWS S3
	AWSRegion          string
	AWSAccessKeyID     string
	AWSSecretAccessKey string
	AWSBucket          string

	// SMTP
	SmtpHost      string
	SmtpPort      string
	SmtpUser      string
	SmtpPassword  string
	SmtpFromEmail string
	AdminEmail    string
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
	redirects := getEnv("OAUTH_ALLOWED_REDIRECT_URIS", "http://localhost:3000/login/callback")

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
		UploadDriver:   getEnv("UPLOAD_DRIVER", "local"),

		// OAuth
		GoogleClientID:        getEnv("GOOGLE_CLIENT_ID", ""),
		GoogleClientSecret:    getEnv("GOOGLE_CLIENT_SECRET", ""),
		OAuthAllowedRedirects: strings.Split(redirects, ","),
		OAuthCallbackBaseURL:  getEnv("OAUTH_CALLBACK_BASE_URL", "http://localhost:8080"),

		// AWS S3
		AWSRegion:          getEnv("AWS_REGION", "ap-southeast-1"),
		AWSAccessKeyID:     getEnv("AWS_ACCESS_KEY_ID", ""),
		AWSSecretAccessKey: getEnv("AWS_SECRET_ACCESS_KEY", ""),
		AWSBucket:          getEnv("AWS_S3_BUCKET", ""),

		// SMTP
		SmtpHost:      getEnv("SMTP_HOST", ""),
		SmtpPort:      getEnv("SMTP_PORT", "587"),
		SmtpUser:      getEnv("SMTP_USER", ""),
		SmtpPassword:  getEnv("SMTP_PASSWORD", ""),
		SmtpFromEmail: getEnv("SMTP_FROM_EMAIL", ""),
		AdminEmail:    getEnv("ADMIN_EMAIL", "roloutfit@gmail.com"),
	}
}
