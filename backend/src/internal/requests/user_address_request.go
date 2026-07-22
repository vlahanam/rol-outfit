package requests

import (
	validation "github.com/go-ozzo/ozzo-validation/v4"
)

type CreateAddressRequest struct {
	RecipientName string   `json:"recipient_name"`
	Phone         string   `json:"phone"`
	Address       string   `json:"address"`
	PostalCode    string   `json:"postal_code"`
	Latitude      *float64 `json:"latitude"`
	Longitude     *float64 `json:"longitude"`
}

func (r CreateAddressRequest) Validate() error {
	return validation.ValidateStruct(&r,
		validation.Field(&r.RecipientName,
			validation.Required.Error("validation.recipient_name.required"),
			validation.Length(1, 100).Error("validation.recipient_name.length"),
		),
		validation.Field(&r.Phone,
			validation.Required.Error("validation.phone.required"),
			validation.Length(10, 15).Error("validation.phone.length"),
		),
		validation.Field(&r.Address,
			validation.Required.Error("validation.address.required"),
			validation.Length(10, 500).Error("validation.address.length"),
		),
		validation.Field(&r.PostalCode,
			validation.Required.Error("validation.postal_code.required"),
		),
	)
}

type UpdateAddressRequest struct {
	RecipientName *string  `json:"recipient_name"`
	Phone         *string  `json:"phone"`
	Address       *string  `json:"address"`
	PostalCode    *string  `json:"postal_code"`
	Latitude      *float64 `json:"latitude"`
	Longitude     *float64 `json:"longitude"`
}

func (r UpdateAddressRequest) Validate() error {
	return validation.ValidateStruct(&r,
		validation.Field(&r.RecipientName,
			validation.NilOrNotEmpty.Error("validation.recipient_name.empty"),
			validation.Length(0, 100).Error("validation.recipient_name.length"),
		),
		validation.Field(&r.Phone,
			validation.NilOrNotEmpty.Error("validation.phone.empty"),
			validation.Length(0, 15).Error("validation.phone.length"),
		),
		validation.Field(&r.Address,
			validation.NilOrNotEmpty.Error("validation.address.empty"),
		),
		validation.Field(&r.PostalCode,
			validation.NilOrNotEmpty.Error("validation.postal_code.empty"),
		),
	)
}
