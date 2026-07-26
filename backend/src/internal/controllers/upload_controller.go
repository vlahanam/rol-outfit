package controllers

import (
	"errors"
	"io"
	"log/slog"

	"github.com/gofiber/fiber/v3"
	"github.com/vlahanam/rol-outfit/src/internal/common"
	"github.com/vlahanam/rol-outfit/src/internal/services"
)

func UploadFile(svc services.UploadService, maxSize int64) fiber.Handler {
	return func(ctx fiber.Ctx) error {
		fh, err := ctx.FormFile("file")
		if err != nil {
			return ctx.Status(fiber.StatusBadRequest).JSON(
				common.ErrBadRequest.WithReason("file field is required"),
			)
		}

		modelType := ctx.FormValue("model_type", "")
		modelID := ctx.FormValue("model_id", "")

		result, err := svc.Save(ctx.Context(), fh, maxSize, modelType, modelID, nil)
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

		return ctx.Status(fiber.StatusCreated).JSON(common.ResponseData(result))
	}
}

func GetFile(svc services.UploadService) fiber.Handler {
	return func(ctx fiber.Ctx) error {
		key := ctx.Params("*")
		if key == "" {
			return ctx.Status(fiber.StatusBadRequest).JSON(common.ErrBadRequest.WithReason("file key is required"))
		}

		stream, contentType, err := svc.GetFileStream(ctx.Context(), key)
		if err != nil {
			slog.Error("GetFile failed", "key", key, "error", err)
			return ctx.Status(fiber.StatusInternalServerError).JSON(common.ErrInternalServerError)
		}

		if contentType != nil {
			ctx.Set(fiber.HeaderContentType, *contentType)
		}
		ctx.Set(fiber.HeaderCacheControl, "public, max-age=31536000, immutable")

		data, err := io.ReadAll(stream)
		stream.Close()
		if err != nil {
			slog.Error("GetFile read failed", "key", key, "error", err)
			return ctx.Status(fiber.StatusInternalServerError).JSON(common.ErrInternalServerError)
		}

		return ctx.Send(data)
	}
}

func DeleteFile(svc services.UploadService) fiber.Handler {
	return func(ctx fiber.Ctx) error {
		id := ctx.Params("id")
		if err := svc.Delete(ctx.Context(), id); err != nil {
			if errors.Is(err, services.ErrFileNotFound) {
				return ctx.Status(fiber.StatusNotFound).JSON(common.ErrNotFound)
			}
			slog.Error("DeleteFile failed", "id", id, "error", err)
			return ctx.Status(fiber.StatusInternalServerError).JSON(common.ErrInternalServerError)
		}
		return ctx.SendStatus(fiber.StatusNoContent)
	}
}
