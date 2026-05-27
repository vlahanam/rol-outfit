package dto

import (
	"time"

	"github.com/vlahanam/rol-outfit/src/internal/models"
)

type UserAddressDTO struct {
	ID            string `json:"id"`
	RecipientName string `json:"recipient_name"`
	Phone         string `json:"phone"`
	Address       string `json:"address"`
	IsDefault     bool   `json:"is_default"`
	CreatedAt     string `json:"created_at"`
	UpdatedAt     string `json:"updated_at"`
}

func ToUserAddressDTO(a *models.UserAddress) *UserAddressDTO {
	return &UserAddressDTO{
		ID:            a.ID,
		RecipientName: a.RecipientName,
		Phone:         a.Phone,
		Address:       a.Address,
		IsDefault:     a.IsDefault,
		CreatedAt:     a.CreatedAt.Format(time.RFC3339),
		UpdatedAt:     a.UpdatedAt.Format(time.RFC3339),
	}
}

func ToUserAddressDTOList(addresses []*models.UserAddress) []*UserAddressDTO {
	result := make([]*UserAddressDTO, 0, len(addresses))
	for _, a := range addresses {
		result = append(result, ToUserAddressDTO(a))
	}
	return result
}
