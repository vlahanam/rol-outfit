package repositories

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgconn"
	"github.com/vlahanam/rol-outfit/src/internal/models"

	"gorm.io/gorm"
)

// ErrDuplicateEmail is returned when a unique constraint on email is violated.
var ErrDuplicateEmail = errors.New("email already exists")

// ErrDuplicatePhone is returned when a unique constraint on phone is violated.
var ErrDuplicatePhone = errors.New("phone already exists")

// ErrNotFound is returned when an update/delete affects 0 rows.
var ErrNotFound = errors.New("record not found")

// UserRepository định nghĩa các thao tác với bảng users
type UserRepository interface {
	Create(ctx context.Context, user *models.User) error
	FindByEmail(ctx context.Context, email string) (*models.User, error)
	FindByPhone(ctx context.Context, phone string) (*models.User, error)
	FindByID(ctx context.Context, id string) (*models.User, error)
	FindByIDs(ctx context.Context, ids []string) (map[string]*models.User, error)
	List(ctx context.Context, offset, limit int) ([]*models.User, int64, error)
	Update(ctx context.Context, id string, fields map[string]interface{}) error
	SoftDelete(ctx context.Context, id string) error
}

func (r *postgreStorage) Create(ctx context.Context, user *models.User) error {
	if err := r.db.WithContext(ctx).Create(user).Error; err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			if pgErr.ConstraintName == "idx_users_phone" {
				return ErrDuplicatePhone
			}
			return ErrDuplicateEmail
		}
		return fmt.Errorf("failed to create user: %w", err)
	}
	return nil
}

func (r *postgreStorage) FindByEmail(ctx context.Context, email string) (*models.User, error) {
	var user models.User
	err := r.db.WithContext(ctx).
		Where("email = ? AND deleted_at IS NULL", email).
		First(&user).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to find user by email: %w", err)
	}
	return &user, nil
}

func (r *postgreStorage) FindByPhone(ctx context.Context, phone string) (*models.User, error) {
	var user models.User
	err := r.db.WithContext(ctx).
		Where("phone = ? AND deleted_at IS NULL", phone).
		First(&user).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to find user by phone: %w", err)
	}
	return &user, nil
}

func (r *postgreStorage) FindByID(ctx context.Context, id string) (*models.User, error) {
	var user models.User
	err := r.db.WithContext(ctx).
		Where("id = ? AND deleted_at IS NULL", id).
		First(&user).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to find user by id: %w", err)
	}
	return &user, nil
}

func (r *postgreStorage) FindByIDs(ctx context.Context, ids []string) (map[string]*models.User, error) {
	if len(ids) == 0 {
		return make(map[string]*models.User), nil
	}
	var users []*models.User
	err := r.db.WithContext(ctx).
		Where("id IN ? AND deleted_at IS NULL", ids).
		Find(&users).Error
	if err != nil {
		return nil, fmt.Errorf("failed to find users by ids: %w", err)
	}
	result := make(map[string]*models.User, len(users))
	for _, u := range users {
		result[u.ID] = u
	}
	return result, nil
}

// List lấy danh sách users có phân trang, trả về slice và tổng số bản ghi
func (r *postgreStorage) List(ctx context.Context, offset, limit int) ([]*models.User, int64, error) {
	var users []*models.User
	var total int64

	db := r.db.WithContext(ctx).Model(&models.User{}).Where("deleted_at IS NULL")

	if err := db.Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count users: %w", err)
	}

	if err := db.Offset(offset).Limit(limit).Order("created_at DESC").Find(&users).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to list users: %w", err)
	}

	return users, total, nil
}

// Update cập nhật các fields được chỉ định của user theo id
func (r *postgreStorage) Update(ctx context.Context, id string, fields map[string]interface{}) error {
	result := r.db.WithContext(ctx).
		Model(&models.User{}).
		Where("id = ? AND deleted_at IS NULL", id).
		Updates(fields)

	if result.Error != nil {
		var pgErr *pgconn.PgError
		if errors.As(result.Error, &pgErr) && pgErr.Code == "23505" {
			if pgErr.ConstraintName == "idx_users_phone" {
				return ErrDuplicatePhone
			}
			return ErrDuplicateEmail
		}
		return fmt.Errorf("failed to update user: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return ErrNotFound
	}
	return nil
}

// SoftDelete đặt deleted_at để xóa mềm user
func (r *postgreStorage) SoftDelete(ctx context.Context, id string) error {
	now := time.Now()
	result := r.db.WithContext(ctx).
		Model(&models.User{}).
		Where("id = ? AND deleted_at IS NULL", id).
		Update("deleted_at", now)

	if result.Error != nil {
		return fmt.Errorf("failed to soft delete user: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return fmt.Errorf("user not found or already deleted")
	}
	return nil
}
