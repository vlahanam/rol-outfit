package requests

import validation "github.com/go-ozzo/ozzo-validation/v4"

type CreateCategoryRequest struct {
	Name          string `json:"name"`
	NameJa        string `json:"name_ja"`
	Description   string `json:"description"`
	DescriptionJa string `json:"description_ja"`
}

func (r CreateCategoryRequest) Validate() error {
	return validation.ValidateStruct(&r,
		validation.Field(&r.Name,
			validation.Required.Error("validation.name.required"),
			validation.Length(2, 255).Error("validation.name.length"),
		),
	)
}

type UpdateCategoryRequest struct {
	Name          *string `json:"name"`
	NameJa        *string `json:"name_ja"`
	Description   *string `json:"description"`
	DescriptionJa *string `json:"description_ja"`
	Status        *int8   `json:"status"`
}

func (r UpdateCategoryRequest) Validate() error {
	if r.Name != nil {
		if err := validation.Validate(r.Name,
			validation.Length(2, 255).Error("validation.name.length"),
		); err != nil {
			return err
		}
	}
	return nil
}
