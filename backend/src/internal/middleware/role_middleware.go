package middleware

import (
	"github.com/gofiber/fiber/v3"
	"github.com/vlahanam/rol-outfit/src/internal/common"
	"github.com/vlahanam/rol-outfit/src/internal/i18n"
)

// RequireRole checks the role set by JWTAuth middleware.
// JWT numeric values are decoded as float64 by encoding/json.
func RequireRole(requiredRole float64) fiber.Handler {
	return func(ctx fiber.Ctx) error {
		lang := i18n.LangFromHeader(ctx.Get("Accept-Language"))
		role, ok := ctx.Locals("role").(float64)
		if !ok || role != requiredRole {
			return ctx.Status(fiber.StatusForbidden).JSON(
				common.ErrForbidden.WithReason(i18n.T(lang, "error.forbidden")),
			)
		}
		return ctx.Next()
	}
}
