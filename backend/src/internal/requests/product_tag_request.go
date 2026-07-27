package requests

import validation "github.com/go-ozzo/ozzo-validation/v4"

type AssignProductTagsRequest struct {
	TagIDs []string `json:"tag_ids"`
}

func (r AssignProductTagsRequest) Validate() error {
	return validation.ValidateStruct(&r,
		validation.Field(&r.TagIDs, validation.Length(0, 3).Error("validation.tags.max_3")),
	)
}
