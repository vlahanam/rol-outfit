package middleware

import (
	"strings"

	"github.com/gofiber/fiber/v3"
	"github.com/golang-jwt/jwt/v5"
	"github.com/vlahanam/rol-outfit/src/internal/common"
	"github.com/vlahanam/rol-outfit/src/internal/i18n"
)

// JWTAuth validates the Bearer token and sets userID, role, email into ctx.Locals.
func JWTAuth(jwtSecret string) fiber.Handler {
	return func(ctx fiber.Ctx) error {
		lang := i18n.LangFromHeader(ctx.Get("Accept-Language"))
		auth := ctx.Get("Authorization")
		if !strings.HasPrefix(auth, "Bearer ") {
			return ctx.Status(fiber.StatusUnauthorized).JSON(
				common.ErrUnauthorized.WithReason(i18n.T(lang, "error.missing_token")),
			)
		}

		tokenStr := strings.TrimPrefix(auth, "Bearer ")
		token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
			if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, jwt.ErrSignatureInvalid
			}
			return []byte(jwtSecret), nil
		})
		if err != nil || !token.Valid {
			return ctx.Status(fiber.StatusUnauthorized).JSON(
				common.ErrUnauthorized.WithReason(i18n.T(lang, "error.invalid_token")),
			)
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			return ctx.Status(fiber.StatusUnauthorized).JSON(common.ErrUnauthorized)
		}

		sub, ok := claims["sub"].(string)
		if !ok || sub == "" {
			return ctx.Status(fiber.StatusUnauthorized).JSON(common.ErrUnauthorized)
		}
		ctx.Locals("userID", sub)
		ctx.Locals("role", claims["role"])
		ctx.Locals("email", claims["email"])
		return ctx.Next()
	}
}
