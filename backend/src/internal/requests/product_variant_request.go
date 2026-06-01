package requests

import (
	"encoding/json"
	"time"

	validation "github.com/go-ozzo/ozzo-validation/v4"
)

func validateVariantDiscountWindow(start, end *time.Time) error {
	if start != nil && end != nil && !start.Before(*end) {
		return validation.NewError("validation.discount.invalid_range", "validation.discount.invalid_range")
	}
	return nil
}

type CreateVariantRequest struct {
	Name            string          `json:"name"`
	NameJa          string          `json:"name_ja"`
	Attributes      json.RawMessage `json:"attributes"`
	Price           float64         `json:"price"`
	Stock           int             `json:"stock"`
	Avatar          string          `json:"avatar"`
	DiscountPercent float64         `json:"discount_percent"`
	DiscountStartAt *time.Time      `json:"discount_start_at"`
	DiscountEndAt   *time.Time      `json:"discount_end_at"`
}

func (r CreateVariantRequest) Validate() error {
	if err := validation.ValidateStruct(&r,
		validation.Field(&r.Attributes,
			validation.Required.Error("validation.attributes.required"),
			validation.By(validateJSONObject(r.Attributes)),
		),
		validation.Field(&r.Price,
			validation.Min(float64(0)).Error("validation.price.invalid"),
		),
		validation.Field(&r.Stock,
			validation.Min(0).Error("validation.stock.min"),
		),
		validation.Field(&r.DiscountPercent,
			validation.Min(float64(0)).Error("validation.discount.invalid"),
			validation.Max(float64(100)).Error("validation.discount.invalid"),
		),
	); err != nil {
		return err
	}
	return validateVariantDiscountWindow(r.DiscountStartAt, r.DiscountEndAt)
}

type UpdateVariantRequest struct {
	Name            *string         `json:"name"`
	NameJa          *string         `json:"name_ja"`
	Attributes      json.RawMessage `json:"attributes"`
	Price           *float64        `json:"price"`
	Stock           *int            `json:"stock"`
	Avatar          *string         `json:"avatar"`
	Status          *int8           `json:"status"`
	DiscountPercent *float64        `json:"discount_percent"`
	DiscountStartAt *time.Time      `json:"discount_start_at"`
	DiscountEndAt   *time.Time      `json:"discount_end_at"`
}

func (r UpdateVariantRequest) Validate() error {
	if len(r.Attributes) > 0 {
		if err := validation.Validate(r.Attributes,
			validation.By(validateJSONObject(r.Attributes)),
		); err != nil {
			return err
		}
	}
	if r.Price != nil {
		if err := validation.Validate(r.Price,
			validation.Min(float64(0)).Error("validation.price.invalid"),
		); err != nil {
			return err
		}
	}
	if r.Stock != nil {
		if err := validation.Validate(r.Stock,
			validation.Min(0).Error("validation.stock.min"),
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
		if err := validateVariantDiscountWindow(r.DiscountStartAt, r.DiscountEndAt); err != nil {
			return err
		}
	}
	return nil
}

// validateJSONObject ensures raw JSON is a non-empty object {}.
func validateJSONObject(raw json.RawMessage) validation.RuleFunc {
	return func(_ interface{}) error {
		if len(raw) == 0 {
			return validation.NewError("validation.attributes.required", "validation.attributes.required")
		}
		var obj map[string]interface{}
		if err := json.Unmarshal(raw, &obj); err != nil {
			return validation.NewError("validation.attributes.invalid", "validation.attributes.invalid")
		}
		return nil
	}
}
