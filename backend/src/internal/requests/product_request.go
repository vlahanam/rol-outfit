package requests

import (
	validation "github.com/go-ozzo/ozzo-validation/v4"
)

type CreateProductRequest struct {
	CategoryID     string   `json:"category_id"`
	Name           string   `json:"name"`
	DefaultPrice   float64  `json:"default_price"`
	Description    string   `json:"description"`
	Avatar         string   `json:"avatar"`
	AttributeNames []string `json:"attribute_names"`
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
	CategoryID     *string  `json:"category_id"`
	Name           *string  `json:"name"`
	DefaultPrice   *float64 `json:"default_price"`
	Description    *string  `json:"description"`
	Avatar         *string  `json:"avatar"`
	Status         *int8    `json:"status"`
	AttributeNames []string `json:"attribute_names"`
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
