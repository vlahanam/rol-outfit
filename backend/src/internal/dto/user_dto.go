package dto

import (
	"time"

	"github.com/vlahanam/rol-outfit/src/internal/models"
)

type FullUserDTO struct {
	ID        string `json:"id"`
	FullName  string `json:"full_name"`
	Email     string `json:"email"`
	Password  string `json:"password"`
	Address   string `json:"address"`
	Phone     string `json:"phone"`
	Role      int8   `json:"role"`
	Status    int8   `json:"status"`
	CreatedAt string `json:"created_at"`
	UpdatedAt string `json:"updated_at"`
}

// MapUser ánh xạ User sang bất kỳ kiểu DTO nào thông qua mapper function.
// Ví dụ: dto.MapUser(user, dto.ToFullDTO)
func MapUser[T any](u *models.User, mapper func(*models.User) T) T {
	return mapper(u)
}

// ToFullDTO trả về FullUserDTO với toàn bộ thông tin user.
func ToFullDTO(u *models.User) *FullUserDTO {
	return &FullUserDTO{
		ID:        u.ID,
		FullName:  u.FullName,
		Email:     u.Email,
		Password:  u.Password,
		Address:   u.Address,
		Phone:     u.Phone,
		Role:      u.Role,
		Status:    u.Status,
		CreatedAt: u.CreatedAt.Format(time.RFC3339),
		UpdatedAt: u.UpdatedAt.Format(time.RFC3339),
	}
}
