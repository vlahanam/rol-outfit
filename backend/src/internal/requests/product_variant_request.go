package requests

import (
	"encoding/json"

	validation "github.com/go-ozzo/ozzo-validation/v4"
)

type CreateVariantRequest struct {
	Attributes json.RawMessage `json:"attributes"`
	Price      float64         `json:"price"`
	Stock      int             `json:"stock"`
	Avatar     string          `json:"avatar"`
}

func (r CreateVariantRequest) Validate() error {
	return validation.ValidateStruct(&r,
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
	)
}

type UpdateVariantRequest struct {
	Attributes json.RawMessage `json:"attributes"`
	Price      *float64        `json:"price"`
	Stock      *int            `json:"stock"`
	Avatar     *string         `json:"avatar"`
	Status     *int8           `json:"status"`
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
