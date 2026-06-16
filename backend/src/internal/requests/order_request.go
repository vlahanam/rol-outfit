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
	Status int8   `json:"status"`
	Note   string `json:"note"`
}

func (r UpdateOrderStatusRequest) Validate() error {
	return validation.ValidateStruct(&r,
		validation.Field(&r.Status,
			validation.Required.Error("validation.order_status.required"),
			validation.Min(int8(1)).Error("validation.order_status.invalid"),
			validation.Max(int8(8)).Error("validation.order_status.invalid"),
		),
	)
}

type RefundRequest struct {
	Reason string `json:"reason"`
}

func (r RefundRequest) Validate() error {
	return validation.ValidateStruct(&r,
		validation.Field(&r.Reason, validation.Length(0, 500)),
	)
}

type RejectRefundRequest struct {
	Reason string `json:"reason"`
}

func (r RejectRefundRequest) Validate() error {
	return validation.ValidateStruct(&r,
		validation.Field(&r.Reason,
			validation.Required.Error("validation.reason.required"),
			validation.Length(1, 500),
		),
	)
}

type UpdateOrderShippingRequest struct {
	ShippingAddress *string `json:"shipping_address"`
	Phone           *string `json:"phone"`
	Note            *string `json:"note"`
}

type CancelOrderRequest struct {
	Reason string `json:"reason"`
}

func (r UpdateOrderShippingRequest) Validate() error {
	if r.Phone != nil {
		if err := validation.Validate(*r.Phone,
			validation.Length(10, 15).Error("validation.phone.length"),
		); err != nil {
			return err
		}
	}
	return nil
}
