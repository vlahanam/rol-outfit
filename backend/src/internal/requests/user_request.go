package requests

import (
	"fmt"

	validation "github.com/go-ozzo/ozzo-validation/v4"
	"github.com/vlahanam/rol-outfit/src/internal/models"
)

// CreateAdminUserRequest dùng cho admin tạo user mới với role/status tùy chọn.
type CreateAdminUserRequest struct {
	FullName string `json:"full_name"`
	Email    string `json:"email"`
	Password string `json:"password"`
	Phone    string `json:"phone"`
	Role     *int8  `json:"role"`   // default: USER_ROLE_CUSTOMER (2)
	Status   *int8  `json:"status"` // default: USER_STATUS_ACTIVE (1)
}

func (r CreateAdminUserRequest) Validate() error {
	return validation.ValidateStruct(&r,
		validation.Field(&r.FullName,
			validation.Required.Error("validation.full_name.required"),
			validation.Length(2, 255).Error("validation.full_name.length"),
		),
		validation.Field(&r.Email,
			validation.Required.Error("validation.email.required"),
			validation.By(func(value interface{}) error {
				if !isValidEmail(fmt.Sprintf("%v", value)) {
					return fmt.Errorf("validation.email.invalid")
				}
				return nil
			}),
		),
		validation.Field(&r.Password,
			validation.Required.Error("validation.password.required"),
			validation.Length(8, 100).Error("validation.password.length"),
		),
		validation.Field(&r.Phone,
			validation.Length(0, 20).Error("validation.phone.length"),
		),
		validation.Field(&r.Role,
			validation.By(func(v interface{}) error {
				if r.Role == nil {
					return nil
				}
				if *r.Role != models.USER_ROLE_ADMIN && *r.Role != models.USER_ROLE_CUSTOMER {
					return fmt.Errorf("validation.role.invalid")
				}
				return nil
			}),
		),
		validation.Field(&r.Status,
			validation.By(func(v interface{}) error {
				if r.Status == nil {
					return nil
				}
				if *r.Status != models.USER_STATUS_ACTIVE && *r.Status != models.USER_STATUS_LOCKED {
					return fmt.Errorf("validation.status.invalid")
				}
				return nil
			}),
		),
	)
}

// UpdateUserRequest dùng cho admin cập nhật bất kỳ user.
type UpdateUserRequest struct {
	FullName *string `json:"full_name"`
	Email    *string `json:"email"`
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
	if r.Role != nil {
		if *r.Role != models.USER_ROLE_ADMIN && *r.Role != models.USER_ROLE_CUSTOMER {
			return fmt.Errorf("validation.role.invalid")
		}
	}
	if r.Status != nil {
		if *r.Status != models.USER_STATUS_ACTIVE && *r.Status != models.USER_STATUS_LOCKED {
			return fmt.Errorf("validation.status.invalid")
		}
	}
	return nil
}

// UpdateMeRequest dùng cho user tự cập nhật thông tin cá nhân (không đổi role/status).
type UpdateMeRequest struct {
	FullName *string `json:"full_name"`
	Phone    *string `json:"phone"`
	Avatar   *string `json:"avatar"`
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
	if r.Avatar != nil {
		if err := validation.Validate(*r.Avatar,
			validation.Length(0, 500).Error("validation.avatar.length"),
		); err != nil {
			return err
		}
	}
	return nil
}

// ChangePasswordRequest dùng cho user đổi mật khẩu.
type ChangePasswordRequest struct {
	CurrentPassword string `json:"current_password"`
	NewPassword     string `json:"new_password"`
}

func (r ChangePasswordRequest) Validate() error {
	return validation.ValidateStruct(&r,
		validation.Field(&r.CurrentPassword,
			validation.Required.Error("validation.current_password.required"),
		),
		validation.Field(&r.NewPassword,
			validation.Required.Error("validation.new_password.required"),
			validation.Length(8, 100).Error("validation.password.length"),
		),
	)
}
