package services

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"

	"github.com/aws/aws-sdk-go-v2/aws"
	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/google/uuid"
	"github.com/vlahanam/rol-outfit/src/internal/models"
	"github.com/vlahanam/rol-outfit/src/internal/repositories"
)

var (
	ErrFileTooBig       = errors.New("file exceeds maximum allowed size")
	ErrFileTypeNotAllow = errors.New("file type not allowed")
	ErrFileNotFound     = errors.New("file not found")
)

var allowedMIME = map[string]string{
	"image/jpeg": ".jpg",
	"image/png":  ".png",
	"image/webp": ".webp",
	"image/gif":  ".gif",
}

type UploadResult struct {
	ID           string `json:"id"`
	OriginalName string `json:"original_name"`
	FilePath     string `json:"file_path"`
	FileSize     int64  `json:"file_size"`
	MimeType     string `json:"mime_type"`
	URL          string `json:"url"`
}

type UploadService interface {
	Save(ctx context.Context, fh *multipart.FileHeader, maxSize int64, modelType, modelID string, metadata map[string]interface{}) (*UploadResult, error)
	Delete(ctx context.Context, id string) error
	GetFileURL(key string) string
}

type uploadService struct {
	s3Client *s3.Client
	bucket   string
	region   string
	repo     repositories.UploadRepository
}

func NewUploadService(awsRegion, awsAccessKeyID, awsSecretAccessKey, bucket string, repo repositories.UploadRepository) (UploadService, error) {
	cfg, err := awsconfig.LoadDefaultConfig(context.Background(),
		awsconfig.WithRegion(awsRegion),
		awsconfig.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(awsAccessKeyID, awsSecretAccessKey, "")),
	)
	if err != nil {
		return nil, fmt.Errorf("unable to load AWS SDK config: %w", err)
	}

	client := s3.NewFromConfig(cfg)

	return &uploadService{
		s3Client: client,
		bucket:   bucket,
		region:   awsRegion,
		repo:     repo,
	}, nil
}

func (s *uploadService) Save(ctx context.Context, fh *multipart.FileHeader, maxSize int64, modelType, modelID string, metadata map[string]interface{}) (*UploadResult, error) {
	if fh.Size > maxSize {
		return nil, ErrFileTooBig
	}

	src, err := fh.Open()
	if err != nil {
		return nil, fmt.Errorf("open upload: %w", err)
	}
	defer src.Close()

	buf := make([]byte, 512)
	n, err := src.Read(buf)
	if err != nil && err != io.EOF {
		return nil, fmt.Errorf("read upload: %w", err)
	}
	detected := http.DetectContentType(buf[:n])
	ext, ok := allowedMIME[detected]
	if !ok {
		return nil, ErrFileTypeNotAllow
	}
	if _, err := src.Seek(0, io.SeekStart); err != nil {
		return nil, fmt.Errorf("seek upload: %w", err)
	}

	key := fmt.Sprintf("uploads/%s%s", uuid.New().String(), ext)

	_, err = s.s3Client.PutObject(ctx, &s3.PutObjectInput{
		Bucket:      aws.String(s.bucket),
		Key:         aws.String(key),
		Body:        src,
		ContentType: aws.String(detected),
	})
	if err != nil {
		return nil, fmt.Errorf("s3 upload: %w", err)
	}

	url := s.GetFileURL(key)

	meta := models.JSONB("{}")
	if metadata != nil {
		b, _ := json.Marshal(metadata)
		meta = models.JSONB(b)
	}

	upload := &models.Upload{
		ID:           uuid.New().String(),
		OriginalName: fh.Filename,
		FilePath:     key,
		FileSize:     fh.Size,
		MimeType:     detected,
		ModelType:    modelType,
		ModelID:      modelID,
		Metadata:     meta,
	}

	if err := s.repo.CreateUpload(ctx, upload); err != nil {
		// Best-effort cleanup of S3 object on DB failure
		_, _ = s.s3Client.DeleteObject(ctx, &s3.DeleteObjectInput{
			Bucket: aws.String(s.bucket),
			Key:    aws.String(key),
		})
		return nil, fmt.Errorf("save upload record: %w", err)
	}

	return &UploadResult{
		ID:           upload.ID,
		OriginalName: upload.OriginalName,
		FilePath:     upload.FilePath,
		FileSize:     upload.FileSize,
		MimeType:     upload.MimeType,
		URL:          url,
	}, nil
}

func (s *uploadService) Delete(ctx context.Context, id string) error {
	upload, err := s.repo.FindUploadByID(ctx, id)
	if err != nil {
		return ErrFileNotFound
	}

	_, err = s.s3Client.DeleteObject(ctx, &s3.DeleteObjectInput{
		Bucket: aws.String(s.bucket),
		Key:    aws.String(upload.FilePath),
	})
	if err != nil {
		return fmt.Errorf("s3 delete: %w", err)
	}

	if err := s.repo.SoftDeleteUpload(ctx, id); err != nil {
		return fmt.Errorf("soft delete upload record: %w", err)
	}

	return nil
}

func (s *uploadService) GetFileURL(key string) string {
	return fmt.Sprintf("https://%s.s3.%s.amazonaws.com/%s", s.bucket, s.region, key)
}
