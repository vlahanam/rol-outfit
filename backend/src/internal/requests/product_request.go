package requests

import (
	"time"

	validation "github.com/go-ozzo/ozzo-validation/v4"
)

func validateDiscountWindow(start, end *time.Time) error {
	if start != nil && end != nil && !start.Before(*end) {
		return validation.NewError("validation.discount.invalid_range", "validation.discount.invalid_range")
	}
	return nil
}

type CreateProductRequest struct {
	CategoryID      string     `json:"category_id"`
	Name            string     `json:"name"`
	DefaultPrice    float64    `json:"default_price"`
	Description     string     `json:"description"`
	Avatar          string     `json:"avatar"`
	AttributeNames  []string   `json:"attribute_names"`
	DiscountPercent float64    `json:"discount_percent"`
	DiscountStartAt *time.Time `json:"discount_start_at"`
	DiscountEndAt   *time.Time `json:"discount_end_at"`
}

func (r CreateProductRequest) Validate() error {
	if err := validation.ValidateStruct(&r,
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
		validation.Field(&r.Avatar,
			validation.Required.Error("validation.avatar.required"),
		),
		validation.Field(&r.DiscountPercent,
			validation.Min(float64(0)).Error("validation.discount.invalid"),
			validation.Max(float64(100)).Error("validation.discount.invalid"),
		),
	); err != nil {
		return err
	}
	return validateDiscountWindow(r.DiscountStartAt, r.DiscountEndAt)
}

type UpdateProductRequest struct {
	CategoryID      *string    `json:"category_id"`
	Name            *string    `json:"name"`
	DefaultPrice    *float64   `json:"default_price"`
	Description     *string    `json:"description"`
	Avatar          *string    `json:"avatar"`
	Status          *int8      `json:"status"`
	AttributeNames  []string   `json:"attribute_names"`
	DiscountPercent *float64   `json:"discount_percent"`
	DiscountStartAt *time.Time `json:"discount_start_at"`
	DiscountEndAt   *time.Time `json:"discount_end_at"`
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
	if r.DiscountPercent != nil {
		if err := validation.Validate(*r.DiscountPercent,
			validation.Min(float64(0)).Error("validation.discount.invalid"),
			validation.Max(float64(100)).Error("validation.discount.invalid"),
		); err != nil {
			return err
		}
		if err := validateDiscountWindow(r.DiscountStartAt, r.DiscountEndAt); err != nil {
			return err
		}
	}
	return nil
}
