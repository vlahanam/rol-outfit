package controllers

import (
	"errors"
	"log/slog"

	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"
	"github.com/vlahanam/rol-outfit/src/internal/common"
	"github.com/vlahanam/rol-outfit/src/internal/dto"
	"github.com/vlahanam/rol-outfit/src/internal/i18n"
	"github.com/vlahanam/rol-outfit/src/internal/repositories"
	"github.com/vlahanam/rol-outfit/src/internal/requests"
	"github.com/vlahanam/rol-outfit/src/internal/services"
	"gorm.io/gorm"
)

func newAddressService(db *gorm.DB) services.UserAddressService {
	repo := repositories.NewPostgreSQLStorage(db)
	return services.NewUserAddressService(repo)
}

func ListAddresses(db *gorm.DB) fiber.Handler {
	return func(ctx fiber.Ctx) error {
		userID, err := userIDFromLocals(ctx)
		if err != nil {
			return ctx.Status(fiber.StatusUnauthorized).JSON(common.ErrUnauthorized)
		}

		svc := newAddressService(db)
		addresses, err := svc.List(ctx.Context(), userID)
		if err != nil {
			slog.Error("ListAddresses failed", "error", err)
			return ctx.Status(fiber.StatusInternalServerError).JSON(common.ErrInternalServerError)
		}
		return ctx.JSON(common.ResponseData(dto.ToUserAddressDTOList(addresses)))
	}
}

func CreateAddress(db *gorm.DB) fiber.Handler {
	return func(ctx fiber.Ctx) error {
		lang := i18n.LangFromHeader(ctx.Get("Accept-Language"))
		userID, err := userIDFromLocals(ctx)
		if err != nil {
			return ctx.Status(fiber.StatusUnauthorized).JSON(common.ErrUnauthorized)
		}

		var req requests.CreateAddressRequest
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

		svc := newAddressService(db)
		address, err := svc.Create(ctx.Context(), userID, &req)
		if err != nil {
			if errors.Is(err, services.ErrMaxAddressReached) {
				return ctx.Status(fiber.StatusBadRequest).JSON(
					common.ErrBadRequest.WithReason(i18n.T(lang, "error.max_addresses_reached")),
				)
			}
			slog.Error("CreateAddress failed", "error", err)
			return ctx.Status(fiber.StatusInternalServerError).JSON(common.ErrInternalServerError)
		}
		return ctx.Status(fiber.StatusCreated).JSON(common.ResponseData(dto.ToUserAddressDTO(address)))
	}
}

func UpdateAddress(db *gorm.DB) fiber.Handler {
	return func(ctx fiber.Ctx) error {
		lang := i18n.LangFromHeader(ctx.Get("Accept-Language"))
		userID, err := userIDFromLocals(ctx)
		if err != nil {
			return ctx.Status(fiber.StatusUnauthorized).JSON(common.ErrUnauthorized)
		}
		addressID := ctx.Params("id")
		if _, err := uuid.Parse(addressID); err != nil {
			return ctx.Status(fiber.StatusBadRequest).JSON(
				common.ErrBadRequest.WithReason(i18n.T(lang, "error.invalid_id")),
			)
		}

		var req requests.UpdateAddressRequest
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

		svc := newAddressService(db)
		if err := svc.Update(ctx.Context(), userID, addressID, &req); err != nil {
			if errors.Is(err, services.ErrAddressNotFound) {
				return ctx.Status(fiber.StatusNotFound).JSON(
					common.ErrNotFound.WithReason(i18n.T(lang, "error.address_not_found")),
				)
			}
			if errors.Is(err, services.ErrAddressNotOwned) {
				return ctx.Status(fiber.StatusForbidden).JSON(
					common.ErrForbidden.WithReason(i18n.T(lang, "error.address_not_owned")),
				)
			}
			slog.Error("UpdateAddress failed", "error", err)
			return ctx.Status(fiber.StatusInternalServerError).JSON(common.ErrInternalServerError)
		}
		return ctx.SendStatus(fiber.StatusNoContent)
	}
}

func DeleteAddress(db *gorm.DB) fiber.Handler {
	return func(ctx fiber.Ctx) error {
		lang := i18n.LangFromHeader(ctx.Get("Accept-Language"))
		userID, err := userIDFromLocals(ctx)
		if err != nil {
			return ctx.Status(fiber.StatusUnauthorized).JSON(common.ErrUnauthorized)
		}
		addressID := ctx.Params("id")
		if _, err := uuid.Parse(addressID); err != nil {
			return ctx.Status(fiber.StatusBadRequest).JSON(
				common.ErrBadRequest.WithReason(i18n.T(lang, "error.invalid_id")),
			)
		}

		svc := newAddressService(db)
		if err := svc.Delete(ctx.Context(), userID, addressID); err != nil {
			if errors.Is(err, services.ErrAddressNotFound) {
				return ctx.Status(fiber.StatusNotFound).JSON(
					common.ErrNotFound.WithReason(i18n.T(lang, "error.address_not_found")),
				)
			}
			if errors.Is(err, services.ErrAddressNotOwned) {
				return ctx.Status(fiber.StatusForbidden).JSON(
					common.ErrForbidden.WithReason(i18n.T(lang, "error.address_not_owned")),
				)
			}
			if errors.Is(err, services.ErrCannotDeleteDefault) {
				return ctx.Status(fiber.StatusBadRequest).JSON(
					common.ErrBadRequest.WithReason(i18n.T(lang, "error.cannot_delete_default")),
				)
			}
			slog.Error("DeleteAddress failed", "error", err)
			return ctx.Status(fiber.StatusInternalServerError).JSON(common.ErrInternalServerError)
		}
		return ctx.SendStatus(fiber.StatusNoContent)
	}
}

func SetDefaultAddress(db *gorm.DB) fiber.Handler {
	return func(ctx fiber.Ctx) error {
		lang := i18n.LangFromHeader(ctx.Get("Accept-Language"))
		userID, err := userIDFromLocals(ctx)
		if err != nil {
			return ctx.Status(fiber.StatusUnauthorized).JSON(common.ErrUnauthorized)
		}
		addressID := ctx.Params("id")
		if _, err := uuid.Parse(addressID); err != nil {
			return ctx.Status(fiber.StatusBadRequest).JSON(
				common.ErrBadRequest.WithReason(i18n.T(lang, "error.invalid_id")),
			)
		}

		svc := newAddressService(db)
		if err := svc.SetDefault(ctx.Context(), userID, addressID); err != nil {
			if errors.Is(err, services.ErrAddressNotFound) {
				return ctx.Status(fiber.StatusNotFound).JSON(
					common.ErrNotFound.WithReason(i18n.T(lang, "error.address_not_found")),
				)
			}
			if errors.Is(err, services.ErrAddressNotOwned) {
				return ctx.Status(fiber.StatusForbidden).JSON(
					common.ErrForbidden.WithReason(i18n.T(lang, "error.address_not_owned")),
				)
			}
			slog.Error("SetDefaultAddress failed", "error", err)
			return ctx.Status(fiber.StatusInternalServerError).JSON(common.ErrInternalServerError)
		}
		return ctx.SendStatus(fiber.StatusNoContent)
	}
}
