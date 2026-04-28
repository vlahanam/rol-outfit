package requests

import (
	"encoding/json"

	validation "github.com/go-ozzo/ozzo-validation/v4"
)

type CreateProductRequest struct {
	CategoryID   string          `json:"category_id"`
	Name         string          `json:"name"`
	DefaultPrice float64         `json:"default_price"`
	Description  string          `json:"description"`
	Data         json.RawMessage `json:"data"`
}

func (r CreateProductRequest) Validate() error {
	return validation.ValidateStruct(&r,
		validation.Field(&r.CategoryID,
			validation.Required.Error("validation.category_id.required"),
		),
		validation.Field(&r.Name,
			validation.Required.Error("validation.name.required"),
			validation.Length(2, 255).Error("validation.name.length"),
		),
		validation.Field(&r.DefaultPrice,
			validation.Min(float64(0)).Error("validation.price.invalid"),
		),
	)
}

type UpdateProductRequest struct {
	CategoryID   *string         `json:"category_id"`
	Name         *string         `json:"name"`
	DefaultPrice *float64        `json:"default_price"`
	Description  *string         `json:"description"`
	Status       *int8           `json:"status"`
	Data         json.RawMessage `json:"data"`
}

func (r UpdateProductRequest) Validate() error {
	if r.Name != nil {
		if err := validation.Validate(r.Name,
			validation.Length(2, 255).Error("validation.name.length"),
		); err != nil {
			return err
		}
	}
	if r.DefaultPrice != nil {
		if err := validation.Validate(r.DefaultPrice,
			validation.Min(float64(0)).Error("validation.price.invalid"),
		); err != nil {
			return err
		}
	}
	return nil
}
