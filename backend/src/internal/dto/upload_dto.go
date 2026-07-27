package dto

import "github.com/vlahanam/rol-outfit/src/internal/models"

type UploadDTO struct {
	ID           string `json:"id"`
	OriginalName string `json:"original_name"`
	FilePath     string `json:"file_path"`
	FileSize     int64  `json:"file_size"`
	MimeType     string `json:"mime_type"`
}

func ToUploadDTO(u *models.Upload) *UploadDTO {
	return &UploadDTO{
		ID:           u.ID,
		OriginalName: u.OriginalName,
		FilePath:     u.FilePath,
		FileSize:     u.FileSize,
		MimeType:     u.MimeType,
	}
}
