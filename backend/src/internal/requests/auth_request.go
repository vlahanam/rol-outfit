package requests

import (
	"fmt"
	"regexp"

	validation "github.com/go-ozzo/ozzo-validation/v4"
)

// emailRegex kiểm tra định dạng email cơ bản
var emailRegex = regexp.MustCompile(`^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`)

// isValidEmail trả về true nếu email hợp lệ
func isValidEmail(email string) bool {
	return emailRegex.MatchString(email)
}

// RegisterRequest chứa dữ liệu đăng ký tài khoản mới
type RegisterRequest struct {
	FullName string `json:"full_name"`
	Email    string `json:"email"`
	Password string `json:"password"`
	Phone    string `json:"phone"`
}

// LoginRequest chứa dữ liệu đăng nhập
type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// Validate kiểm tra tính hợp lệ của dữ liệu đăng ký
func (r RegisterRequest) Validate() error {
	return validation.ValidateStruct(&r,
		validation.Field(&r.FullName,
			validation.Length(0, 255).Error("validation.full_name.length"),
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
	)
}

// Validate kiểm tra tính hợp lệ của dữ liệu đăng nhập
func (r LoginRequest) Validate() error {
	return validation.ValidateStruct(&r,
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
		),
	)
}

// RefreshRequest chứa dữ liệu yêu cầu làm mới token
type RefreshRequest struct {
	RefreshToken string `json:"refresh_token"`
}

func (r RefreshRequest) Validate() error {
	return validation.ValidateStruct(&r,
		validation.Field(&r.RefreshToken,
			validation.Required.Error("validation.refresh_token.required"),
		),
	)
}
