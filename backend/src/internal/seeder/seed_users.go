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
	Role     int8
}

var users = []seedUser{
	{
		FullName: "Quản Trị Viên",
		Email:    "admin@rol-outfit.com",
		Password: "123456789",
		Phone:    "0900000001",
		Role:     models.USER_ROLE_ADMIN,
	},
	{
		FullName: "Nguyễn Văn A",
		Email:    "customer1@rol-outfit.com",
		Password: "123456789",
		Phone:    "0900000002",
		Role:     models.USER_ROLE_CUSTOMER,
	},
	{
		FullName: "Trần Thị B",
		Email:    "customer2@rol-outfit.com",
		Password: "123456789",
		Phone:    "0900000003",
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

		hashStr := string(hash)
		row := models.User{
			ID:       uuid.New().String(),
			FullName: u.FullName,
			Email:    u.Email,
			Password: &hashStr,
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
