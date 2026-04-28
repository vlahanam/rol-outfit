package seeder

import (
	"errors"
	"log"

	"github.com/google/uuid"
	"github.com/vlahanam/rol-outfit/src/internal/models"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type seedUser struct {
	FullName string
	Email    string
	Password string
	Phone    string
	Address  string
	Role     int8
}

var users = []seedUser{
	{
		FullName: "Quản Trị Viên",
		Email:    "admin@rol-outfit.com",
		Password: "Admin@123",
		Phone:    "0900000001",
		Address:  "Trụ sở Rol Outfit, TP. Hồ Chí Minh",
		Role:     models.USER_ROLE_ADMIN,
	},
	{
		FullName: "Nguyễn Văn A",
		Email:    "customer1@rol-outfit.com",
		Password: "Customer@123",
		Phone:    "0900000002",
		Address:  "123 Lê Lợi, Quận 1, TP. Hồ Chí Minh",
		Role:     models.USER_ROLE_CUSTOMER,
	},
	{
		FullName: "Trần Thị B",
		Email:    "customer2@rol-outfit.com",
		Password: "Customer@123",
		Phone:    "0900000003",
		Address:  "456 Trần Hưng Đạo, Quận 5, TP. Hồ Chí Minh",
		Role:     models.USER_ROLE_CUSTOMER,
	},
}

// SeedUsers inserts default users; skips by matching email.
func SeedUsers(db *gorm.DB) (Result, error) {
	res := Result{}
	for _, u := range users {
		var existing models.User
		err := db.Where("email = ? AND deleted_at IS NULL", u.Email).First(&existing).Error
		if err == nil {
			log.Printf("  skip user (exists): %s", u.Email)
			res.Skipped++
			continue
		}
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			return res, err
		}

		hash, err := bcrypt.GenerateFromPassword([]byte(u.Password), bcrypt.DefaultCost)
		if err != nil {
			return res, err
		}

		row := models.User{
			ID:       uuid.New().String(),
			FullName: u.FullName,
			Email:    u.Email,
			Password: string(hash),
			Address:  u.Address,
			Phone:    u.Phone,
			Role:     u.Role,
			Status:   1,
		}
		if err := db.Create(&row).Error; err != nil {
			return res, err
		}
		log.Printf("  created user: %s", u.Email)
		res.Created++
	}
	return res, nil
}
