package fileutil

import (
	"fmt"
	"mime"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/google/uuid"
)

// SupportedMIME checks if a MIME type is accepted.
func SupportedMIME(mimeType string) bool {
	supported := map[string]bool{
		"image/jpeg": true,
		"image/png":  true,
		"image/webp": true,
	}
	base, _, _ := mime.ParseMediaType(mimeType)
	return supported[base]
}

// DetectMIME sniffs up to 512 bytes to determine MIME type.
func DetectMIME(data []byte) string {
	if len(data) > 512 {
		data = data[:512]
	}
	return http.DetectContentType(data)
}

// NewTempDir creates a temporary directory with a unique name.
func NewTempDir(base string) (string, error) {
	dir := filepath.Join(base, "gophershrink-"+uuid.New().String())
	if err := os.MkdirAll(dir, 0755); err != nil {
		return "", fmt.Errorf("creating temp dir: %w", err)
	}
	return dir, nil
}

// WriteTempFile writes data to a temp file inside dir.
func WriteTempFile(dir, name string, data []byte) (string, error) {
	path := filepath.Join(dir, name)
	if err := os.WriteFile(path, data, 0644); err != nil {
		return "", fmt.Errorf("writing temp file %s: %w", path, err)
	}
	return path, nil
}

// CleanupExpired removes directories older than ttl.
func CleanupExpired(base string, ttl time.Duration) error {
	entries, err := os.ReadDir(base)
	if err != nil {
		return err
	}
	now := time.Now()
	for _, e := range entries {
		if !strings.HasPrefix(e.Name(), "gophershrink-") {
			continue
		}
		info, err := e.Info()
		if err != nil {
			continue
		}
		if now.Sub(info.ModTime()) > ttl {
			_ = os.RemoveAll(filepath.Join(base, e.Name()))
		}
	}
	return nil
}

// SafeExt returns a sanitized file extension.
func SafeExt(filename string) string {
	ext := strings.ToLower(filepath.Ext(filename))
	allowed := map[string]bool{".jpg": true, ".jpeg": true, ".png": true, ".webp": true}
	if allowed[ext] {
		return ext
	}
	return ""
}

// OutputFilename generates the output filename with the correct extension.
func OutputFilename(original, format string) string {
	base := strings.TrimSuffix(original, filepath.Ext(original))
	switch format {
	case "jpeg", "jpg":
		return base + ".jpg"
	case "png":
		return base + ".png"
	case "webp":
		return base + ".webp"
	default:
		return base + ".jpg"
	}
}
