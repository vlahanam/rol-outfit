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

// NOTE: UploadMeAvatar removed - avatar feature deprecated

// GetMe GET /api/v1/users/me — trả về thông tin user đang đăng nhập.
func GetMe(db *gorm.DB) fiber.Handler {
	return func(ctx fiber.Ctx) error {
		lang := i18n.LangFromHeader(ctx.Get("Accept-Language"))
		userID, ok := ctx.Locals("userID").(string)
		if !ok || userID == "" {
			return ctx.Status(fiber.StatusUnauthorized).JSON(
				common.ErrUnauthorized.WithReason(i18n.T(lang, "error.missing_token")),
			)
		}

		repo := repositories.NewPostgreSQLStorage(db)
		svc := services.NewUserService(repo)

		u, err := svc.GetByID(ctx.Context(), userID)
		if err != nil {
			if errors.Is(err, services.ErrUserNotFound) {
				return ctx.Status(fiber.StatusNotFound).JSON(
					common.ErrNotFound.WithReason(i18n.T(lang, "error.user_not_found")),
				)
			}
			slog.Error("GetMe failed", "error", err)
			return ctx.Status(fiber.StatusInternalServerError).JSON(common.ErrInternalServerError)
		}
		return ctx.JSON(common.ResponseData(dto.ToUserDTO(u)))
	}
}

// UpdateMe PUT /api/v1/users/me — user tự cập nhật thông tin cá nhân.
func UpdateMe(db *gorm.DB) fiber.Handler {
	return func(ctx fiber.Ctx) error {
		lang := i18n.LangFromHeader(ctx.Get("Accept-Language"))
		userID, ok := ctx.Locals("userID").(string)
		if !ok || userID == "" {
			return ctx.Status(fiber.StatusUnauthorized).JSON(
				common.ErrUnauthorized.WithReason(i18n.T(lang, "error.missing_token")),
			)
		}

		var req requests.UpdateMeRequest
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
		svc := services.NewUserService(repo)

		if err := svc.UpdateMe(ctx.Context(), userID, &req); err != nil {
			if errors.Is(err, services.ErrUserNotFound) {
				return ctx.Status(fiber.StatusNotFound).JSON(
					common.ErrNotFound.WithReason(i18n.T(lang, "error.user_not_found")),
				)
			}
			if errors.Is(err, services.ErrUserPhoneTaken) {
				return ctx.Status(fiber.StatusConflict).JSON(
					common.ErrConflict.WithReason(i18n.T(lang, "error.phone_already_exists")),
				)
			}
			slog.Error("UpdateMe failed", "error", err)
			return ctx.Status(fiber.StatusInternalServerError).JSON(common.ErrInternalServerError)
		}
		return ctx.SendStatus(fiber.StatusNoContent)
	}
}

// ChangePassword PUT /api/v1/users/me/password — user đổi mật khẩu.
func ChangePassword(db *gorm.DB) fiber.Handler {
	return func(ctx fiber.Ctx) error {
		lang := i18n.LangFromHeader(ctx.Get("Accept-Language"))
		userID, ok := ctx.Locals("userID").(string)
		if !ok || userID == "" {
			return ctx.Status(fiber.StatusUnauthorized).JSON(
				common.ErrUnauthorized.WithReason(i18n.T(lang, "error.missing_token")),
			)
		}

		var req requests.ChangePasswordRequest
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
		svc := services.NewUserService(repo)

		if err := svc.ChangePassword(ctx.Context(), userID, &req); err != nil {
			if errors.Is(err, services.ErrUserNotFound) {
				return ctx.Status(fiber.StatusNotFound).JSON(
					common.ErrNotFound.WithReason(i18n.T(lang, "error.user_not_found")),
				)
			}
			if errors.Is(err, services.ErrInvalidPassword) {
				return ctx.Status(fiber.StatusBadRequest).JSON(
					common.ErrBadRequest.WithReason(i18n.T(lang, "error.invalid_password")),
				)
			}
			slog.Error("ChangePassword failed", "error", err)
			return ctx.Status(fiber.StatusInternalServerError).JSON(common.ErrInternalServerError)
		}
		return ctx.SendStatus(fiber.StatusNoContent)
	}
}

// CreateUser POST /api/v1/admin/users [admin]
func CreateUser(db *gorm.DB) fiber.Handler {
	return func(ctx fiber.Ctx) error {
		lang := i18n.LangFromHeader(ctx.Get("Accept-Language"))

		var req requests.CreateAdminUserRequest
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
		svc := services.NewUserService(repo)

		u, err := svc.Create(ctx.Context(), &req)
		if err != nil {
			if errors.Is(err, services.ErrUserEmailTaken) {
				return ctx.Status(fiber.StatusConflict).JSON(
					common.ErrConflict.WithReason(i18n.T(lang, "error.email_already_exists")),
				)
			}
			if errors.Is(err, services.ErrUserPhoneTaken) {
				return ctx.Status(fiber.StatusConflict).JSON(
					common.ErrConflict.WithReason(i18n.T(lang, "error.phone_already_exists")),
				)
			}
			slog.Error("CreateUser failed", "error", err)
			return ctx.Status(fiber.StatusInternalServerError).JSON(common.ErrInternalServerError)
		}
		return ctx.Status(fiber.StatusCreated).JSON(common.ResponseData(dto.ToUserDTO(u)))
	}
}

// ListUsers GET /api/v1/admin/users?page=&limit= [admin]
func ListUsers(db *gorm.DB) fiber.Handler {
	return func(ctx fiber.Ctx) error {
		var p common.Paging
		if err := ctx.Bind().Query(&p); err != nil {
			p = common.Paging{}
		}
		p.Process()
		offset := (p.Page - 1) * p.Limit

		repo := repositories.NewPostgreSQLStorage(db)
		svc := services.NewUserService(repo)

		users, total, err := svc.List(ctx.Context(), offset, p.Limit)
		if err != nil {
			slog.Error("ListUsers failed", "error", err)
			return ctx.Status(fiber.StatusInternalServerError).JSON(common.ErrInternalServerError)
		}

		result := make([]*dto.UserDTO, 0, len(users))
		for _, u := range users {
			result = append(result, dto.ToUserDTO(u))
		}
		p.Total = total
		return ctx.JSON(common.SuccessResponse(result, p, nil))
	}
}

// GetUser GET /api/v1/admin/users/:id [admin]
func GetUser(db *gorm.DB) fiber.Handler {
	return func(ctx fiber.Ctx) error {
		lang := i18n.LangFromHeader(ctx.Get("Accept-Language"))
		id := ctx.Params("id")

		if _, err := uuid.Parse(id); err != nil {
			return ctx.Status(fiber.StatusBadRequest).JSON(
				common.ErrBadRequest.WithReason(i18n.T(lang, "error.invalid_id")),
			)
		}

		repo := repositories.NewPostgreSQLStorage(db)
		svc := services.NewUserService(repo)

		u, err := svc.GetByID(ctx.Context(), id)
		if err != nil {
			if errors.Is(err, services.ErrUserNotFound) {
				return ctx.Status(fiber.StatusNotFound).JSON(
					common.ErrNotFound.WithReason(i18n.T(lang, "error.user_not_found")),
				)
			}
			slog.Error("GetUser failed", "error", err)
			return ctx.Status(fiber.StatusInternalServerError).JSON(common.ErrInternalServerError)
		}
		return ctx.JSON(common.ResponseData(dto.ToUserDTO(u)))
	}
}

// UpdateUser PUT /api/v1/admin/users/:id [admin]
func UpdateUser(db *gorm.DB) fiber.Handler {
	return func(ctx fiber.Ctx) error {
		lang := i18n.LangFromHeader(ctx.Get("Accept-Language"))
		id := ctx.Params("id")

		if _, err := uuid.Parse(id); err != nil {
			return ctx.Status(fiber.StatusBadRequest).JSON(
				common.ErrBadRequest.WithReason(i18n.T(lang, "error.invalid_id")),
			)
		}

		var req requests.UpdateUserRequest
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
		svc := services.NewUserService(repo)

		if err := svc.Update(ctx.Context(), id, &req); err != nil {
			if errors.Is(err, services.ErrUserNotFound) {
				return ctx.Status(fiber.StatusNotFound).JSON(
					common.ErrNotFound.WithReason(i18n.T(lang, "error.user_not_found")),
				)
			}
			if errors.Is(err, services.ErrUserEmailTaken) {
				return ctx.Status(fiber.StatusConflict).JSON(
					common.ErrConflict.WithReason(i18n.T(lang, "error.email_already_exists")),
				)
			}
			if errors.Is(err, services.ErrUserPhoneTaken) {
				return ctx.Status(fiber.StatusConflict).JSON(
					common.ErrConflict.WithReason(i18n.T(lang, "error.phone_already_exists")),
				)
			}
			slog.Error("UpdateUser failed", "error", err)
			return ctx.Status(fiber.StatusInternalServerError).JSON(common.ErrInternalServerError)
		}
		return ctx.SendStatus(fiber.StatusNoContent)
	}
}

// DeleteUser DELETE /api/v1/admin/users/:id [admin]
func DeleteUser(db *gorm.DB) fiber.Handler {
	return func(ctx fiber.Ctx) error {
		lang := i18n.LangFromHeader(ctx.Get("Accept-Language"))
		id := ctx.Params("id")

		if _, err := uuid.Parse(id); err != nil {
			return ctx.Status(fiber.StatusBadRequest).JSON(
				common.ErrBadRequest.WithReason(i18n.T(lang, "error.invalid_id")),
			)
		}

		repo := repositories.NewPostgreSQLStorage(db)
		svc := services.NewUserService(repo)

		if err := svc.Delete(ctx.Context(), id); err != nil {
			if errors.Is(err, services.ErrUserNotFound) {
				return ctx.Status(fiber.StatusNotFound).JSON(
					common.ErrNotFound.WithReason(i18n.T(lang, "error.user_not_found")),
				)
			}
			slog.Error("DeleteUser failed", "error", err)
			return ctx.Status(fiber.StatusInternalServerError).JSON(common.ErrInternalServerError)
		}
		return ctx.SendStatus(fiber.StatusNoContent)
	}
}
