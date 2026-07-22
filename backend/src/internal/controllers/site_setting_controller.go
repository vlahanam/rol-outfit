package controllers

import (
	"log/slog"

	"github.com/gofiber/fiber/v3"
	"github.com/vlahanam/rol-outfit/src/internal/common"
	"github.com/vlahanam/rol-outfit/src/internal/i18n"
	"github.com/vlahanam/rol-outfit/src/internal/repositories"
	"github.com/vlahanam/rol-outfit/src/internal/services"
	"gorm.io/gorm"
)

// GetSocialLinks GET /api/v1/settings/social-links (public)
func GetSocialLinks(db *gorm.DB) fiber.Handler {
	return func(ctx fiber.Ctx) error {
		repo := repositories.NewPostgreSQLStorage(db)
		svc := services.NewSiteSettingService(repo)

		data, err := svc.GetSocialLinks(ctx.Context())
		if err != nil {
			slog.Error("GetSocialLinks failed", "error", err)
			return ctx.Status(fiber.StatusInternalServerError).JSON(common.ErrInternalServerError)
		}
		return ctx.JSON(common.ResponseData(data))
	}
}

// UpdateSocialLinks PUT /api/v1/admin/settings/social-links (admin)
func UpdateSocialLinks(db *gorm.DB) fiber.Handler {
	return func(ctx fiber.Ctx) error {
		lang := i18n.LangFromHeader(ctx.Get("Accept-Language"))

		var req services.SocialLinksData
		if err := ctx.Bind().JSON(&req); err != nil {
			return ctx.Status(fiber.StatusBadRequest).JSON(
				common.ErrBadRequest.WithReason(i18n.T(lang, "error.invalid_payload")),
			)
		}

		repo := repositories.NewPostgreSQLStorage(db)
		svc := services.NewSiteSettingService(repo)

		if err := svc.UpdateSocialLinks(ctx.Context(), &req); err != nil {
			slog.Error("UpdateSocialLinks failed", "error", err)
			return ctx.Status(fiber.StatusInternalServerError).JSON(common.ErrInternalServerError)
		}
		return ctx.JSON(common.ResponseData(fiber.Map{"updated": true}))
	}
}

// GetChatURL GET /api/v1/settings/chat-url (public)
func GetChatURL(db *gorm.DB) fiber.Handler {
	return func(ctx fiber.Ctx) error {
		repo := repositories.NewPostgreSQLStorage(db)
		svc := services.NewSiteSettingService(repo)

		url, err := svc.GetChatURL(ctx.Context())
		if err != nil {
			slog.Error("GetChatURL failed", "error", err)
			return ctx.Status(fiber.StatusInternalServerError).JSON(common.ErrInternalServerError)
		}
		return ctx.JSON(common.ResponseData(fiber.Map{"chat_url": url}))
	}
}

// UpdateChatURL PUT /api/v1/admin/settings/chat-url (admin)
func UpdateChatURL(db *gorm.DB) fiber.Handler {
	return func(ctx fiber.Ctx) error {
		lang := i18n.LangFromHeader(ctx.Get("Accept-Language"))

		var req struct {
			ChatURL string `json:"chat_url"`
		}
		if err := ctx.Bind().JSON(&req); err != nil {
			return ctx.Status(fiber.StatusBadRequest).JSON(
				common.ErrBadRequest.WithReason(i18n.T(lang, "error.invalid_payload")),
			)
		}

		repo := repositories.NewPostgreSQLStorage(db)
		svc := services.NewSiteSettingService(repo)

		if err := svc.UpdateChatURL(ctx.Context(), req.ChatURL); err != nil {
			slog.Error("UpdateChatURL failed", "error", err)
			return ctx.Status(fiber.StatusInternalServerError).JSON(common.ErrInternalServerError)
		}
		return ctx.JSON(common.ResponseData(fiber.Map{"updated": true}))
	}
}

// GetQRData GET /api/v1/settings/qr (public)
func GetQRData(db *gorm.DB) fiber.Handler {
	return func(ctx fiber.Ctx) error {
		repo := repositories.NewPostgreSQLStorage(db)
		svc := services.NewSiteSettingService(repo)

		data, err := svc.GetQRData(ctx.Context())
		if err != nil {
			slog.Error("GetQRData failed", "error", err)
			return ctx.Status(fiber.StatusInternalServerError).JSON(common.ErrInternalServerError)
		}
		return ctx.JSON(common.ResponseData(data))
	}
}

// UpdateQRData PUT /api/v1/admin/settings/qr (admin)
func UpdateQRData(db *gorm.DB) fiber.Handler {
	return func(ctx fiber.Ctx) error {
		lang := i18n.LangFromHeader(ctx.Get("Accept-Language"))

		var req services.QRData
		if err := ctx.Bind().JSON(&req); err != nil {
			return ctx.Status(fiber.StatusBadRequest).JSON(
				common.ErrBadRequest.WithReason(i18n.T(lang, "error.invalid_payload")),
			)
		}

		repo := repositories.NewPostgreSQLStorage(db)
		svc := services.NewSiteSettingService(repo)

		if err := svc.UpdateQRData(ctx.Context(), &req); err != nil {
			slog.Error("UpdateQRData failed", "error", err)
			return ctx.Status(fiber.StatusInternalServerError).JSON(common.ErrInternalServerError)
		}
		return ctx.JSON(common.ResponseData(fiber.Map{"updated": true}))
	}
}
