package requests

import (
	"time"

	validation "github.com/go-ozzo/ozzo-validation/v4"
)

type CreateTagRequest struct {
	Name    string     `json:"name"`
	StartAt *time.Time `json:"start_at"`
	EndAt   *time.Time `json:"end_at"`
}

func (r CreateTagRequest) Validate() error {
	return validation.ValidateStruct(&r,
		validation.Field(&r.Name,
			validation.Required.Error("validation.name.required"),
			validation.Length(2, 100).Error("validation.name.length"),
		),
	)
}

type UpdateTagRequest struct {
	Name    *string    `json:"name"`
	StartAt *time.Time `json:"start_at"`
	EndAt   *time.Time `json:"end_at"`
}

func (r UpdateTagRequest) Validate() error {
	if r.Name != nil {
		if err := validation.Validate(*r.Name,
			validation.Length(2, 100).Error("validation.name.length"),
		); err != nil {
			return err
		}
	}
	return nil
}
