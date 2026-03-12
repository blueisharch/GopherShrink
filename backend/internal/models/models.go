package models

// CompressionMode defines lossy vs lossless processing.
type CompressionMode string

const (
	ModeLossy    CompressionMode = "lossy"
	ModeLossless CompressionMode = "lossless"
)

// OutputFormat defines the desired output file format.
type OutputFormat string

const (
	FormatJPEG OutputFormat = "jpeg"
	FormatPNG  OutputFormat = "png"
	FormatWebP OutputFormat = "webp"
	FormatAVIF OutputFormat = "avif"
)

// CompressRequest represents a single image compression task.
type CompressRequest struct {
	FileID          string          `json:"file_id"`
	OriginalName    string          `json:"original_name"`
	Mode            CompressionMode `json:"mode"`
	Quality         int             `json:"quality"`          // 1-100
	OutputFormat    OutputFormat    `json:"output_format"`    // empty = same as input
	StripMetadata   bool            `json:"strip_metadata"`
	MaxWidth        int             `json:"max_width"`        // 0 = no resize
	MaxHeight       int             `json:"max_height"`
}

// CompressResult holds the output of a compression job.
type CompressResult struct {
	FileID           string       `json:"file_id"`
	OriginalName     string       `json:"original_name"`
	OriginalSize     int64        `json:"original_size"`
	CompressedSize   int64        `json:"compressed_size"`
	SavingsBytes     int64        `json:"savings_bytes"`
	SavingsPct       float64      `json:"savings_pct"`
	OutputFormat     OutputFormat `json:"output_format"`
	DownloadURL      string       `json:"download_url"`
	Width            int          `json:"width"`
	Height           int          `json:"height"`
}

// BatchResult wraps multiple CompressResult entries.
type BatchResult struct {
	Results     []CompressResult `json:"results"`
	ZipURL      string           `json:"zip_url,omitempty"`
	TotalSaved  int64            `json:"total_saved_bytes"`
	TotalOriginal int64          `json:"total_original_bytes"`
}

// ErrorResponse is the standard API error payload.
type ErrorResponse struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
}

// UploadResponse is returned immediately after a file is accepted.
type UploadResponse struct {
	FileID       string `json:"file_id"`
	OriginalName string `json:"original_name"`
	OriginalSize int64  `json:"original_size"`
	MimeType     string `json:"mime_type"`
}

// HealthResponse is returned by the /health endpoint.
type HealthResponse struct {
	Status  string `json:"status"`
	Workers int    `json:"workers"`
	Version string `json:"version"`
}
