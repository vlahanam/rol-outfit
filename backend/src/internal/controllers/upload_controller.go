package controllers

import (
	"errors"
	"log/slog"

	"github.com/gofiber/fiber/v3"
	"github.com/vlahanam/rol-outfit/src/internal/common"
	"github.com/vlahanam/rol-outfit/src/internal/services"
)

// UploadFile POST /api/v1/uploads
func UploadFile(svc services.UploadService, maxSize int64) fiber.Handler {
	return func(ctx fiber.Ctx) error {
		fh, err := ctx.FormFile("file")
		if err != nil {
			return ctx.Status(fiber.StatusBadRequest).JSON(
				common.ErrBadRequest.WithReason("file field is required"),
			)
		}

		url, err := svc.Save(fh, maxSize)
		if err != nil {
			switch {
			case errors.Is(err, services.ErrFileTooBig):
				return ctx.Status(fiber.StatusRequestEntityTooLarge).JSON(
					common.ErrBadRequest.WithReason("file exceeds maximum size"),
				)
			case errors.Is(err, services.ErrFileTypeNotAllow):
				return ctx.Status(fiber.StatusUnprocessableEntity).JSON(
					common.ErrBadRequest.WithReason("file type not allowed"),
				)
			default:
				slog.Error("UploadFile failed", "error", err)
				return ctx.Status(fiber.StatusInternalServerError).JSON(common.ErrInternalServerError)
			}
		}

		return ctx.Status(fiber.StatusCreated).JSON(fiber.Map{"url": url})
	}
}

// DeleteFile DELETE /api/v1/uploads/:filename
func DeleteFile(svc services.UploadService) fiber.Handler {
	return func(ctx fiber.Ctx) error {
		filename := ctx.Params("filename")
		if err := svc.Delete(filename); err != nil {
			if errors.Is(err, services.ErrFileNotFound) {
				return ctx.Status(fiber.StatusNotFound).JSON(common.ErrNotFound)
			}
			slog.Error("DeleteFile failed", "filename", filename, "error", err)
			return ctx.Status(fiber.StatusInternalServerError).JSON(common.ErrInternalServerError)
		}
		return ctx.SendStatus(fiber.StatusNoContent)
	}
}
