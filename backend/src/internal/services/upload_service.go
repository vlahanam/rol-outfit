package services

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strings"

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

// UploadCleaner deletes uploaded objects that are no longer referenced by any entity.
// UploadService embeds it; services that only need cleanup depend on this narrow interface.
type UploadCleaner interface {
	// ExtractKeys pulls file keys out of raw text (HTML descriptions, widget settings JSON, URLs).
	ExtractKeys(texts ...string) []string
	// DeleteUnusedForModel deletes uploads linked to a model whose FilePath is not in keepKeys.
	// Empty keepKeys deletes every upload linked to the model.
	DeleteUnusedForModel(ctx context.Context, modelType, modelID string, keepKeys []string) error
	// DeleteUnusedForType deletes uploads of a model type whose FilePath is not in keepKeys.
	DeleteUnusedForType(ctx context.Context, modelType string, keepKeys []string) error
}

type UploadService interface {
	UploadCleaner
	Save(ctx context.Context, fh *multipart.FileHeader, maxSize int64, modelType, modelID string, metadata map[string]interface{}) (*UploadResult, error)
	Delete(ctx context.Context, id string) error
	GetFileURL(ctx context.Context, key string) (string, error)
	GetFileStream(ctx context.Context, key string) (io.ReadCloser, *string, error)
}

type uploadService struct {
	s3Client  *s3.Client
	bucket    string
	region    string
	uploadDir string
	uploadURL string
	useLocal  bool
	repo      repositories.UploadRepository
}

func NewUploadService(driver, awsRegion, awsAccessKeyID, awsSecretAccessKey, bucket, uploadDir, uploadURL string, repo repositories.UploadRepository) (UploadService, error) {
	if driver == "local" {
		return &uploadService{
			uploadDir: uploadDir,
			uploadURL: uploadURL,
			useLocal:  true,
			repo:      repo,
		}, nil
	}

	cfg, err := awsconfig.LoadDefaultConfig(context.Background(),
		awsconfig.WithRegion(awsRegion),
		awsconfig.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(awsAccessKeyID, awsSecretAccessKey, "")),
	)
	if err != nil {
		return nil, fmt.Errorf("unable to load AWS SDK config: %w", err)
	}

	client := s3.NewFromConfig(cfg)

	return &uploadService{
		s3Client:  client,
		bucket:    bucket,
		region:    awsRegion,
		uploadDir: uploadDir,
		uploadURL: uploadURL,
		repo:      repo,
	}, nil
}

func uploadSubdir(modelType string) string {
	switch modelType {
	case "product":
		return "products"
	case "product_variant":
		return "product-variants"
	case "description":
		return "descriptions"
	case "banner-slider":
		return "widgets/banner-sliders"
	case "trend-hot":
		return "widgets/trend-hot"
	case "collection-grid":
		return "widgets/collection-grid"
	case "new-product":
		return "widgets/new-product"
	case "settings":
		return "settings"
	case "order":
		return "bill"
	default:
		return ""
	}
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

	var key string
	subdir := uploadSubdir(modelType)
	if subdir != "" {
		key = fmt.Sprintf("uploads/%s/%s%s", subdir, uuid.New().String(), ext)
	} else {
		key = fmt.Sprintf("uploads/%s%s", uuid.New().String(), ext)
	}

	if s.useLocal {
		dstPath := filepath.Join(s.uploadDir, key)
		if err := os.MkdirAll(filepath.Dir(dstPath), 0755); err != nil {
			return nil, fmt.Errorf("create upload dir: %w", err)
		}
		dst, err := os.Create(dstPath)
		if err != nil {
			return nil, fmt.Errorf("create file: %w", err)
		}
		defer dst.Close()
		if _, err := io.Copy(dst, src); err != nil {
			return nil, fmt.Errorf("write file: %w", err)
		}
	} else {
		_, err = s.s3Client.PutObject(ctx, &s3.PutObjectInput{
			Bucket:      aws.String(s.bucket),
			Key:         aws.String(key),
			Body:        src,
			ContentType: aws.String(detected),
		})
		if err != nil {
			return nil, fmt.Errorf("s3 upload: %w", err)
		}
	}

	url, err := s.GetFileURL(ctx, key)
	if err != nil {
		return nil, fmt.Errorf("generate file url: %w", err)
	}

	meta := models.JSONB("{}")
	if metadata != nil {
		b, _ := json.Marshal(metadata)
		meta = models.JSONB(b)
	}

	var modelIDPtr *string
	if modelID != "" {
		modelIDPtr = &modelID
	}

	upload := &models.Upload{
		ID:           uuid.New().String(),
		OriginalName: fh.Filename,
		FilePath:     key,
		FileSize:     fh.Size,
		MimeType:     detected,
		ModelType:    modelType,
		ModelID:      modelIDPtr,
		Metadata:     meta,
	}

	if err := s.repo.CreateUpload(ctx, upload); err != nil {
		if s.useLocal {
			os.Remove(filepath.Join(s.uploadDir, key))
		} else {
			_, _ = s.s3Client.DeleteObject(ctx, &s3.DeleteObjectInput{
				Bucket: aws.String(s.bucket),
				Key:    aws.String(key),
			})
		}
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
		upload, err = s.repo.FindUploadByPath(ctx, id)
		if err != nil {
			return ErrFileNotFound
		}
	}
	return s.deleteUpload(ctx, upload)
}

// deleteUpload removes the stored object (S3 or local) and soft-deletes the DB record.
func (s *uploadService) deleteUpload(ctx context.Context, upload *models.Upload) error {
	if s.useLocal {
		if err := os.Remove(filepath.Join(s.uploadDir, upload.FilePath)); err != nil && !os.IsNotExist(err) {
			return fmt.Errorf("delete file: %w", err)
		}
	} else {
		_, err := s.s3Client.DeleteObject(ctx, &s3.DeleteObjectInput{
			Bucket: aws.String(s.bucket),
			Key:    aws.String(upload.FilePath),
		})
		if err != nil {
			return fmt.Errorf("s3 delete: %w", err)
		}
	}

	if err := s.repo.SoftDeleteUpload(ctx, upload.ID); err != nil {
		return fmt.Errorf("soft delete upload record: %w", err)
	}
	return nil
}

func (s *uploadService) DeleteUnusedForModel(ctx context.Context, modelType, modelID string, keepKeys []string) error {
	uploads, err := s.repo.ListUploadsByModel(ctx, modelType, modelID)
	if err != nil {
		return fmt.Errorf("failed to list uploads: %w", err)
	}
	return s.deleteUnused(ctx, uploads, keepKeys)
}

func (s *uploadService) DeleteUnusedForType(ctx context.Context, modelType string, keepKeys []string) error {
	uploads, err := s.repo.ListUploadsByModelType(ctx, modelType)
	if err != nil {
		return fmt.Errorf("failed to list uploads: %w", err)
	}
	return s.deleteUnused(ctx, uploads, keepKeys)
}

func (s *uploadService) deleteUnused(ctx context.Context, uploads []*models.Upload, keepKeys []string) error {
	keep := make(map[string]struct{}, len(keepKeys))
	for _, k := range keepKeys {
		keep[k] = struct{}{}
	}
	var errs []error
	for _, u := range uploads {
		if _, ok := keep[u.FilePath]; ok {
			continue
		}
		if err := s.deleteUpload(ctx, u); err != nil {
			errs = append(errs, fmt.Errorf("upload %s: %w", u.ID, err))
		}
	}
	return errors.Join(errs...)
}

// ExtractKeys finds every referenced file key in the given texts (HTML, JSON, plain URLs)
// by scanning for the service's public URL prefix.
func (s *uploadService) ExtractKeys(texts ...string) []string {
	prefix := "/api/v1/files/"
	if s.useLocal {
		prefix = s.uploadURL + "/"
	}
	var keys []string
	seen := make(map[string]struct{})
	for _, text := range texts {
		rest := text
		for {
			idx := strings.Index(rest, prefix)
			if idx < 0 {
				break
			}
			rest = rest[idx+len(prefix):]
			var key strings.Builder
			for _, r := range rest {
				if r == '"' || r == '\'' || r == ')' || r == '>' || r == '<' ||
					r == ' ' || r == '\n' || r == '\t' || r == '\\' {
					break
				}
				key.WriteRune(r)
			}
			if key.Len() == 0 {
				continue
			}
			k := key.String()
			if _, ok := seen[k]; !ok {
				seen[k] = struct{}{}
				keys = append(keys, k)
			}
		}
	}
	return keys
}

func (s *uploadService) GetFileURL(ctx context.Context, key string) (string, error) {
	if s.useLocal {
		return fmt.Sprintf("%s/%s", s.uploadURL, key), nil
	}
	return fmt.Sprintf("/api/v1/files/%s", key), nil
}

func (s *uploadService) GetFileStream(ctx context.Context, key string) (io.ReadCloser, *string, error) {
	if s.useLocal {
		fullPath := filepath.Join(s.uploadDir, key)
		f, err := os.Open(fullPath)
		if err != nil {
			return nil, nil, fmt.Errorf("open local file: %w", err)
		}
		// Detect content type from extension
		ext := filepath.Ext(key)
		ct := mimeTypeByExt(ext)
		return f, &ct, nil
	}
	out, err := s.s3Client.GetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(s.bucket),
		Key:    aws.String(key),
	})
	if err != nil {
		return nil, nil, fmt.Errorf("s3 get object: %w", err)
	}
	return out.Body, out.ContentType, nil
}

func mimeTypeByExt(ext string) string {
	switch strings.ToLower(ext) {
	case ".jpg", ".jpeg":
		return "image/jpeg"
	case ".png":
		return "image/png"
	case ".webp":
		return "image/webp"
	case ".gif":
		return "image/gif"
	default:
		return "application/octet-stream"
	}
}
