package controllers

import (
	"errors"
	"log/slog"

	"github.com/vlahanam/rol-outfit/src/internal/common"
	"github.com/vlahanam/rol-outfit/src/internal/i18n"
	"github.com/vlahanam/rol-outfit/src/internal/repositories"
	"github.com/vlahanam/rol-outfit/src/internal/requests"
	"github.com/vlahanam/rol-outfit/src/internal/services"

	"github.com/gofiber/fiber/v3"
	"gorm.io/gorm"
)

// Register xử lý request đăng ký tài khoản mới
// POST /api/v1/auth/register
func Register(db *gorm.DB, jwtSecret string) fiber.Handler {
	return func(ctx fiber.Ctx) error {
		lang := i18n.LangFromHeader(ctx.Get("Accept-Language"))

		var req requests.RegisterRequest
		if err := ctx.Bind().JSON(&req); err != nil {
			return ctx.Status(fiber.StatusBadRequest).JSON(
				common.ErrBadRequest.WithReason(i18n.T(lang, "error.invalid_payload")),
			)
		}

		if err := req.Validate(); err != nil {
			details := common.ParseValidationErrors(err, lang)
			resp := common.ErrBadRequest.WithReason(i18n.T(lang, "validation.failed"))
			if details != nil {
				resp = resp.WithDetails(details)
			}
			return ctx.Status(fiber.StatusBadRequest).JSON(resp)
		}

		repo := repositories.NewPostgreSQLStorage(db)
		svc := services.NewAuthService(repo, jwtSecret)

		tokens, err := svc.Register(ctx.Context(), &req)
		if err != nil {
			if errors.Is(err, services.ErrEmailAlreadyExists) {
				return ctx.Status(fiber.StatusConflict).JSON(
					common.ErrConflict.WithReason(i18n.T(lang, "error.email_already_exists")),
				)
			}
			if errors.Is(err, services.ErrPhoneAlreadyExists) {
				return ctx.Status(fiber.StatusConflict).JSON(
					common.ErrConflict.WithReason(i18n.T(lang, "error.phone_already_exists")),
				)
			}
			slog.Error("Register failed", "error", err)
			return ctx.Status(fiber.StatusInternalServerError).JSON(
				common.ErrInternalServerError,
			)
		}

		return ctx.Status(fiber.StatusCreated).JSON(common.ResponseData(tokens))
	}
}

// Login xử lý request đăng nhập
// POST /api/v1/auth/login
func Login(db *gorm.DB, jwtSecret string) fiber.Handler {
	return func(ctx fiber.Ctx) error {
		lang := i18n.LangFromHeader(ctx.Get("Accept-Language"))

		var req requests.LoginRequest

		if err := ctx.Bind().JSON(&req); err != nil {
			return ctx.Status(fiber.StatusBadRequest).JSON(
				common.ErrBadRequest.WithReason(i18n.T(lang, "error.invalid_payload")),
			)
		}

		if err := req.Validate(); err != nil {
			details := common.ParseValidationErrors(err, lang)
			resp := common.ErrBadRequest.WithReason(i18n.T(lang, "validation.failed"))
			if details != nil {
				resp = resp.WithDetails(details)
			}
			return ctx.Status(fiber.StatusBadRequest).JSON(resp)
		}

		repo := repositories.NewPostgreSQLStorage(db)
		svc := services.NewAuthService(repo, jwtSecret)

		tokens, err := svc.Login(ctx.Context(), &req)
		if err != nil {
			if errors.Is(err, services.ErrInvalidCredentials) {
				return ctx.Status(fiber.StatusUnauthorized).JSON(
					common.ErrUnauthorized.WithReason(i18n.T(lang, "error.invalid_credentials")),
				)
			}
			if errors.Is(err, services.ErrUserNotActive) {
				return ctx.Status(fiber.StatusForbidden).JSON(
					common.ErrForbidden.WithReason(i18n.T(lang, "error.account_disabled")),
				)
			}
			slog.Error("Login failed", "error", err)
			return ctx.Status(fiber.StatusInternalServerError).JSON(
				common.ErrInternalServerError,
			)
		}

		return ctx.Status(fiber.StatusOK).JSON(common.ResponseData(tokens))
	}
}
