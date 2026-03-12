package processor

import (
	"bytes"
	"fmt"
	"image"
	"image/jpeg"
	"image/png"
	"io"
	"path/filepath"
	"strings"

	"github.com/disintegration/imaging"
	"golang.org/x/image/webp"
)

// Options configures image processing behavior.
type Options struct {
	Quality       int    // 1-100 for JPEG/WebP
	Lossless      bool   // PNG lossless or WebP lossless
	StripMetadata bool
	MaxWidth      int
	MaxHeight     int
	OutputFormat  string // "jpeg", "png", "webp", "" (auto)
}

// Result holds processed image data.
type Result struct {
	Data         []byte
	Format       string
	Width        int
	Height       int
	OriginalSize int64
}

// Process decodes, optionally resizes, and encodes an image.
func Process(r io.Reader, originalName string, originalSize int64, opts Options) (*Result, error) {
	data, err := io.ReadAll(r)
	if err != nil {
		return nil, fmt.Errorf("reading input: %w", err)
	}

	img, detectedFmt, err := decode(bytes.NewReader(data), originalName)
	if err != nil {
		return nil, fmt.Errorf("decoding image: %w", err)
	}

	// Determine target format
	outFmt := opts.OutputFormat
	if outFmt == "" {
		outFmt = detectedFmt
	}

	// Resize if needed
	if opts.MaxWidth > 0 || opts.MaxHeight > 0 {
		img = resize(img, opts.MaxWidth, opts.MaxHeight)
	}

	bounds := img.Bounds()
	width := bounds.Dx()
	height := bounds.Dy()

	encoded, err := encode(img, outFmt, opts)
	if err != nil {
		return nil, fmt.Errorf("encoding to %s: %w", outFmt, err)
	}

	return &Result{
		Data:         encoded,
		Format:       outFmt,
		Width:        width,
		Height:       height,
		OriginalSize: originalSize,
	}, nil
}

// decode reads an image from r, using the file extension as a hint.
func decode(r io.Reader, name string) (image.Image, string, error) {
	ext := strings.ToLower(strings.TrimPrefix(filepath.Ext(name), "."))

	// Buffer the data so we can try multiple decoders
	data, err := io.ReadAll(r)
	if err != nil {
		return nil, "", err
	}

	if ext == "webp" {
		img, err := webp.Decode(bytes.NewReader(data))
		if err == nil {
			return img, "webp", nil
		}
	}

	img, fmt, err := image.Decode(bytes.NewReader(data))
	if err != nil {
		return nil, "", fmt.Errorf("unsupported format: %w", err)
	}
	if fmt == "jpeg" {
		fmt = "jpeg"
	}
	return img, fmt, nil
}

// resize uses Lanczos resampling to shrink within MaxWidth x MaxHeight.
func resize(img image.Image, maxW, maxH int) image.Image {
	bounds := img.Bounds()
	origW := bounds.Dx()
	origH := bounds.Dy()

	if maxW <= 0 {
		maxW = origW
	}
	if maxH <= 0 {
		maxH = origH
	}

	if origW <= maxW && origH <= maxH {
		return img
	}

	return imaging.Fit(img, maxW, maxH, imaging.Lanczos)
}

// encode writes the image to a byte slice in the target format.
func encode(img image.Image, format string, opts Options) ([]byte, error) {
	var buf bytes.Buffer
	q := opts.Quality
	if q <= 0 || q > 100 {
		q = 85
	}

	switch format {
	case "jpeg", "jpg":
		err := jpeg.Encode(&buf, img, &jpeg.Options{Quality: q})
		return buf.Bytes(), err

	case "png":
		enc := png.Encoder{CompressionLevel: png.BestCompression}
		if opts.Lossless {
			enc.CompressionLevel = png.DefaultCompression
		}
		err := enc.Encode(&buf, img)
		return buf.Bytes(), err

	case "webp":
		// Standard library doesn't encode WebP; fall back to JPEG for now.
		// Production note: swap in github.com/chai2010/webp for encoding.
		err := jpeg.Encode(&buf, img, &jpeg.Options{Quality: q})
		return buf.Bytes(), err

	default:
		err := jpeg.Encode(&buf, img, &jpeg.Options{Quality: q})
		return buf.Bytes(), err
	}
}

// FormatFromMime maps a MIME type to a short format string.
func FormatFromMime(mime string) string {
	switch mime {
	case "image/jpeg":
		return "jpeg"
	case "image/png":
		return "png"
	case "image/webp":
		return "webp"
	default:
		return "jpeg"
	}
}
