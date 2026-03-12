package config

import (
	"os"
	"runtime"
	"strconv"
	"time"
)

// Config holds all application configuration.
type Config struct {
	Port         string
	WorkerCount  int
	MaxFileSize  int64
	TempDir      string
	TTLMinutes   int
	ReadTimeout  time.Duration
	WriteTimeout time.Duration
	IdleTimeout  time.Duration
	AllowOrigins []string
}

// Load reads configuration from environment variables with sane defaults.
func Load() *Config {
	workerCount := runtime.NumCPU()
	if wc := os.Getenv("WORKER_COUNT"); wc != "" {
		if parsed, err := strconv.Atoi(wc); err == nil && parsed > 0 {
			workerCount = parsed
		}
	}

	maxFileSize := int64(50 << 20) // 50 MB default
	if mfs := os.Getenv("MAX_FILE_SIZE_MB"); mfs != "" {
		if parsed, err := strconv.ParseInt(mfs, 10, 64); err == nil {
			maxFileSize = parsed << 20
		}
	}

	port := getEnv("PORT", "8080")
	tempDir := getEnv("TEMP_DIR", os.TempDir())

	return &Config{
		Port:         port,
		WorkerCount:  workerCount,
		MaxFileSize:  maxFileSize,
		TempDir:      tempDir,
		TTLMinutes:   30,
		ReadTimeout:  60 * time.Second,
		WriteTimeout: 120 * time.Second,
		IdleTimeout:  180 * time.Second,
		AllowOrigins: []string{"http://localhost:5173", "http://localhost:3000"},
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
