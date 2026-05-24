package requests

import (
	"encoding/json"

	validation "github.com/go-ozzo/ozzo-validation/v4"
)

var validWidgetTypes = []interface{}{"banner-slider", "collection-grid", "new-product", "trend-hot"}

type CreateWidgetRequest struct {
	ParentID     *string         `json:"parent_id"`
	Name         string          `json:"name"`
	Type         string          `json:"type"`
	DisplayOrder int             `json:"display_order"`
	Status       int8            `json:"status"`
	Settings     json.RawMessage `json:"settings"`
	Metadata     json.RawMessage `json:"metadata"`
}

func (r CreateWidgetRequest) Validate() error {
	return validation.ValidateStruct(&r,
		validation.Field(&r.Name,
			validation.Required.Error("validation.name.required"),
			validation.Length(2, 255).Error("validation.name.length"),
		),
		validation.Field(&r.Type,
			validation.Required.Error("validation.type.required"),
			validation.In(validWidgetTypes...).Error("validation.type.invalid"),
		),
		validation.Field(&r.DisplayOrder,
			validation.Min(0).Error("validation.display_order.min"),
		),
		validation.Field(&r.Status,
			validation.In(int8(1), int8(2)).Error("validation.status.invalid"),
		),
	)
}

type UpdateWidgetRequest struct {
	Name         *string         `json:"name"`
	Type         *string         `json:"type"`
	DisplayOrder *int            `json:"display_order"`
	Status       *int8           `json:"status"`
	Settings     json.RawMessage `json:"settings"`
	Metadata     json.RawMessage `json:"metadata"`
}

func (r UpdateWidgetRequest) Validate() error {
	if r.Name != nil {
		if err := validation.Validate(r.Name,
			validation.Length(2, 255).Error("validation.name.length"),
		); err != nil {
			return err
		}
	}
	if r.Type != nil {
		if err := validation.Validate(r.Type,
			validation.In(validWidgetTypes...).Error("validation.type.invalid"),
		); err != nil {
			return err
		}
	}
	if r.DisplayOrder != nil {
		if err := validation.Validate(r.DisplayOrder,
			validation.Min(0).Error("validation.display_order.min"),
		); err != nil {
			return err
		}
	}
	if r.Status != nil {
		if err := validation.Validate(r.Status,
			validation.In(int8(1), int8(2)).Error("validation.status.invalid"),
		); err != nil {
			return err
		}
	}
	return nil
}
