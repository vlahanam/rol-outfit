package common

import (
	validation "github.com/go-ozzo/ozzo-validation/v4"
	i18npkg "github.com/vlahanam/rol-outfit/src/internal/i18n"
)

// ParseValidationErrors converts ozzo-validation.Errors to a translated details map.
// Returns nil if err is not a validation.Errors type.
func ParseValidationErrors(err error, lang string) map[string]interface{} {
	verrs, ok := err.(validation.Errors)
	if !ok {
		return nil
	}
	details := make(map[string]interface{}, len(verrs))
	for field, fieldErr := range verrs {
		key := fieldErr.Error()
		details[field] = i18npkg.T(lang, key)
	}
	return details
}
