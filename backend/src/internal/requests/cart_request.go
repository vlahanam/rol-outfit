package requests

import validation "github.com/go-ozzo/ozzo-validation/v4"

type AddCartItemRequest struct {
	ProductID string `json:"product_id"`
	AttrID    string `json:"attr_id"`
	Quantity  int    `json:"quantity"`
}

func (r AddCartItemRequest) Validate() error {
	return validation.ValidateStruct(&r,
		validation.Field(&r.ProductID,
			validation.Required.Error("validation.product_id.required"),
		),
		validation.Field(&r.Quantity,
			validation.Min(1).Error("validation.quantity.min"),
		),
	)
}

type UpdateCartItemRequest struct {
	Quantity int `json:"quantity"`
}

func (r UpdateCartItemRequest) Validate() error {
	return validation.ValidateStruct(&r,
		validation.Field(&r.Quantity,
			validation.Min(1).Error("validation.quantity.min"),
		),
	)
}
