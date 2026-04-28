package services

import (
	"errors"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/google/uuid"
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

type UploadService interface {
	Save(fh *multipart.FileHeader, maxSize int64) (url string, err error)
	Delete(filename string) error
}

type uploadService struct {
	uploadDir string
	uploadURL string
}

func NewUploadService(uploadDir, uploadURL string) UploadService {
	return &uploadService{uploadDir: uploadDir, uploadURL: uploadURL}
}

func (s *uploadService) Save(fh *multipart.FileHeader, maxSize int64) (string, error) {
	if fh.Size > maxSize {
		return "", ErrFileTooBig
	}

	src, err := fh.Open()
	if err != nil {
		return "", fmt.Errorf("open upload: %w", err)
	}
	defer src.Close()

	// Detect MIME from actual file bytes — do not trust client-supplied Content-Type
	buf := make([]byte, 512)
	n, err := src.Read(buf)
	if err != nil && err != io.EOF {
		return "", fmt.Errorf("read upload: %w", err)
	}
	detected := http.DetectContentType(buf[:n])
	ext, ok := allowedMIME[detected]
	if !ok {
		return "", ErrFileTypeNotAllow
	}
	if _, err := src.Seek(0, io.SeekStart); err != nil {
		return "", fmt.Errorf("seek upload: %w", err)
	}

	if err := os.MkdirAll(s.uploadDir, 0o755); err != nil {
		return "", fmt.Errorf("mkdir upload dir: %w", err)
	}

	filename := uuid.New().String() + ext
	dst := filepath.Join(s.uploadDir, filename)

	out, err := os.Create(dst)
	if err != nil {
		return "", fmt.Errorf("create file: %w", err)
	}

	// Clean up partial file on any write failure
	success := false
	defer func() {
		out.Close()
		if !success {
			os.Remove(dst)
		}
	}()

	if _, err := io.Copy(out, src); err != nil {
		return "", fmt.Errorf("write file: %w", err)
	}

	success = true
	return s.uploadURL + "/" + filename, nil
}

func (s *uploadService) Delete(filename string) error {
	if strings.ContainsAny(filename, "/\\") {
		return errors.New("invalid filename")
	}
	path := filepath.Join(s.uploadDir, filename)
	// Defence-in-depth: verify resolved path stays within uploadDir
	if !strings.HasPrefix(path, filepath.Clean(s.uploadDir)+string(os.PathSeparator)) {
		return errors.New("invalid filename")
	}
	if err := os.Remove(path); err != nil {
		if os.IsNotExist(err) {
			return ErrFileNotFound
		}
		return fmt.Errorf("delete file: %w", err)
	}
	return nil
}
