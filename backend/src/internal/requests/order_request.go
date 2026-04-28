package requests

import validation "github.com/go-ozzo/ozzo-validation/v4"

type CreateOrderRequest struct {
	ShippingAddress string `json:"shipping_address"`
	Phone           string `json:"phone"`
	Note            string `json:"note"`
}

func (r CreateOrderRequest) Validate() error {
	return validation.ValidateStruct(&r,
		validation.Field(&r.ShippingAddress,
			validation.Required.Error("validation.shipping_address.required"),
		),
		validation.Field(&r.Phone,
			validation.Required.Error("validation.phone.required"),
			validation.Length(10, 15).Error("validation.phone.length"),
		),
	)
}

type UpdateOrderStatusRequest struct {
	Status int8 `json:"status"`
}

func (r UpdateOrderStatusRequest) Validate() error {
	return validation.ValidateStruct(&r,
		validation.Field(&r.Status,
			validation.Required.Error("validation.order_status.required"),
			validation.Min(int8(1)).Error("validation.order_status.invalid"),
			validation.Max(int8(6)).Error("validation.order_status.invalid"),
		),
	)
}
