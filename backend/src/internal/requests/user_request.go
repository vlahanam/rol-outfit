package requests

import (
	"fmt"

	validation "github.com/go-ozzo/ozzo-validation/v4"
)

// UpdateUserRequest dùng cho admin cập nhật bất kỳ user.
type UpdateUserRequest struct {
	FullName *string `json:"full_name"`
	Email    *string `json:"email"`
	Address  *string `json:"address"`
	Phone    *string `json:"phone"`
	Role     *int8   `json:"role"`
	Status   *int8   `json:"status"`
}

func (r UpdateUserRequest) Validate() error {
	if r.FullName != nil {
		if err := validation.Validate(*r.FullName,
			validation.Length(2, 255).Error("validation.full_name.length"),
		); err != nil {
			return err
		}
	}
	if r.Email != nil {
		if err := validation.Validate(*r.Email,
			validation.By(func(value interface{}) error {
				if !isValidEmail(fmt.Sprintf("%v", value)) {
					return fmt.Errorf("validation.email.invalid")
				}
				return nil
			}),
		); err != nil {
			return err
		}
	}
	if r.Phone != nil {
		if err := validation.Validate(*r.Phone,
			validation.Length(0, 20).Error("validation.phone.length"),
		); err != nil {
			return err
		}
	}
	return nil
}

// UpdateMeRequest dùng cho user tự cập nhật thông tin cá nhân (không đổi role/status).
type UpdateMeRequest struct {
	FullName *string `json:"full_name"`
	Address  *string `json:"address"`
	Phone    *string `json:"phone"`
}

func (r UpdateMeRequest) Validate() error {
	if r.FullName != nil {
		if err := validation.Validate(*r.FullName,
			validation.Length(2, 255).Error("validation.full_name.length"),
		); err != nil {
			return err
		}
	}
	if r.Phone != nil {
		if err := validation.Validate(*r.Phone,
			validation.Length(0, 20).Error("validation.phone.length"),
		); err != nil {
			return err
		}
	}
	return nil
}
