package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"math"
	"net/http"
	"strconv"
	"time"

	"github.com/GourangaDasSamrat/gophershrink/internal/models"
	"github.com/GourangaDasSamrat/gophershrink/internal/processor"
	"github.com/GourangaDasSamrat/gophershrink/internal/worker"
	"github.com/GourangaDasSamrat/gophershrink/pkg/compression"
	"github.com/GourangaDasSamrat/gophershrink/pkg/fileutil"
	"github.com/GourangaDasSamrat/gophershrink/pkg/ziputil"
	"github.com/google/uuid"
)

// Handler holds shared dependencies for all HTTP handlers.
type Handler struct {
	pool    *worker.Pool
	store   *compression.Store
	maxSize int64
}

// New creates a Handler with the given dependencies.
func New(pool *worker.Pool, store *compression.Store, maxSize int64) *Handler {
	return &Handler{pool: pool, store: store, maxSize: maxSize}
}

// Health returns service health and worker info.
func (h *Handler) Health(w http.ResponseWriter, r *http.Request) {
	resp := models.HealthResponse{
		Status:  "ok",
		Workers: h.pool.WorkerCount(),
		Version: "1.0.0",
	}
	jsonResponse(w, http.StatusOK, resp)
}

// Compress handles a single-file compression request.
func (h *Handler) Compress(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseMultipartForm(h.maxSize); err != nil {
		jsonError(w, http.StatusBadRequest, "request too large or malformed")
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		jsonError(w, http.StatusBadRequest, "missing 'file' field")
		return
	}
	defer file.Close()

	data, err := io.ReadAll(io.LimitReader(file, h.maxSize))
	if err != nil {
		jsonError(w, http.StatusInternalServerError, "reading file failed")
		return
	}

	mime := fileutil.DetectMIME(data)
	if !fileutil.SupportedMIME(mime) {
		jsonError(w, http.StatusUnsupportedMediaType, "unsupported image format: "+mime)
		return
	}

	opts := parseFormOptions(r)
	fileID := uuid.New().String()
	originalSize := int64(len(data))
	resultCh := make(chan error, 1)

	h.pool.Submit(worker.Job{
		ID:     fileID,
		Result: resultCh,
		Execute: func(ctx context.Context) error {
			res, err := processor.Process(bytes.NewReader(data), header.Filename, originalSize, opts)
			if err != nil {
				return err
			}
			outName := fileutil.OutputFilename(header.Filename, res.Format)
			h.store.Set(fileID, &compression.Entry{
				Data:     res.Data,
				Filename: outName,
				Format:   res.Format,
			})

			compressedSize := int64(len(res.Data))
			saved := originalSize - compressedSize
			pct := 0.0
			if originalSize > 0 {
				pct = math.Round((float64(saved)/float64(originalSize))*10000) / 100
			}

			result := models.CompressResult{
				FileID:         fileID,
				OriginalName:   header.Filename,
				OriginalSize:   originalSize,
				CompressedSize: compressedSize,
				SavingsBytes:   saved,
				SavingsPct:     pct,
				OutputFormat:   models.OutputFormat(res.Format),
				DownloadURL:    "/api/v1/download/" + fileID,
				Width:          res.Width,
				Height:         res.Height,
			}
			jsonResponse(w, http.StatusOK, result)
			return nil
		},
	})

	select {
	case err := <-resultCh:
		if err != nil {
			jsonError(w, http.StatusInternalServerError, "compression failed: "+err.Error())
		}
	case <-time.After(120 * time.Second):
		jsonError(w, http.StatusGatewayTimeout, "processing timeout")
	}
}

// BatchCompress handles multiple files and returns a zip download.
func (h *Handler) BatchCompress(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseMultipartForm(h.maxSize * 20); err != nil {
		jsonError(w, http.StatusBadRequest, "request too large")
		return
	}

	files := r.MultipartForm.File["files"]
	if len(files) == 0 {
		jsonError(w, http.StatusBadRequest, "no files provided")
		return
	}

	opts := parseFormOptions(r)
	type jobResult struct {
		name string
		data []byte
		orig int64
		comp int64
	}

	resultsCh := make(chan jobResult, len(files))
	errsCh := make(chan error, len(files))

	for _, fh := range files {
		fh := fh
		jobID := uuid.New().String()
		errCh := make(chan error, 1)

		h.pool.Submit(worker.Job{
			ID:     jobID,
			Result: errCh,
			Execute: func(ctx context.Context) error {
				f, err := fh.Open()
				if err != nil {
					return err
				}
				defer f.Close()

				data, err := io.ReadAll(io.LimitReader(f, h.maxSize))
				if err != nil {
					return err
				}
				if !fileutil.SupportedMIME(fileutil.DetectMIME(data)) {
					return fmt.Errorf("unsupported format for %s", fh.Filename)
				}

				res, err := processor.Process(bytes.NewReader(data), fh.Filename, int64(len(data)), opts)
				if err != nil {
					return err
				}

				outName := fileutil.OutputFilename(fh.Filename, res.Format)
				resultsCh <- jobResult{
					name: outName,
					data: res.Data,
					orig: int64(len(data)),
					comp: int64(len(res.Data)),
				}
				return nil
			},
		})

		go func() {
			if err := <-errCh; err != nil {
				errsCh <- err
			}
		}()
	}

	// Collect results
	collected := make(map[string][]byte)
	var totalOrig, totalComp int64
	var results []models.CompressResult

	timeout := time.After(3 * time.Minute)
	for i := 0; i < len(files); i++ {
		select {
		case jr := <-resultsCh:
			collected[jr.name] = jr.data
			totalOrig += jr.orig
			totalComp += jr.comp
			results = append(results, models.CompressResult{
				OriginalSize:   jr.orig,
				CompressedSize: jr.comp,
				SavingsBytes:   jr.orig - jr.comp,
			})
		case err := <-errsCh:
			jsonError(w, http.StatusUnprocessableEntity, err.Error())
			return
		case <-timeout:
			jsonError(w, http.StatusGatewayTimeout, "batch processing timeout")
			return
		}
	}

	zipData, err := ziputil.CreateZip(collected)
	if err != nil {
		jsonError(w, http.StatusInternalServerError, "zip creation failed")
		return
	}

	zipID := uuid.New().String()
	h.store.Set(zipID, &compression.Entry{
		Data:     zipData,
		Filename: "gophershrink-batch.zip",
		Format:   "zip",
	})

	jsonResponse(w, http.StatusOK, models.BatchResult{
		Results:       results,
		ZipURL:        "/api/v1/download/" + zipID,
		TotalSaved:    totalOrig - totalComp,
		TotalOriginal: totalOrig,
	})
}

// Download serves a compressed file by fileID.
func (h *Handler) Download(w http.ResponseWriter, r *http.Request) {
	fileID := r.PathValue("fileID")
	if fileID == "" {
		jsonError(w, http.StatusBadRequest, "missing file ID")
		return
	}

	entry, err := h.store.Get(fileID)
	if err != nil {
		jsonError(w, http.StatusNotFound, "file not found or expired")
		return
	}

	w.Header().Set("Content-Disposition", `attachment; filename="`+entry.Filename+`"`)
	w.Header().Set("Content-Type", mimeFromFormat(entry.Format))
	w.Header().Set("Content-Length", strconv.Itoa(len(entry.Data)))
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write(entry.Data)
}

// --- helpers ---

func parseFormOptions(r *http.Request) processor.Options {
	q, _ := strconv.Atoi(r.FormValue("quality"))
	if q <= 0 || q > 100 {
		q = 82
	}
	maxW, _ := strconv.Atoi(r.FormValue("max_width"))
	maxH, _ := strconv.Atoi(r.FormValue("max_height"))

	return processor.Options{
		Quality:       q,
		Lossless:      r.FormValue("mode") == "lossless",
		StripMetadata: r.FormValue("strip_metadata") == "true",
		MaxWidth:      maxW,
		MaxHeight:     maxH,
		OutputFormat:  r.FormValue("output_format"),
	}
}

func jsonResponse(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func jsonError(w http.ResponseWriter, status int, msg string) {
	jsonResponse(w, status, models.ErrorResponse{Code: status, Message: msg})
}

func mimeFromFormat(format string) string {
	switch format {
	case "jpeg", "jpg":
		return "image/jpeg"
	case "png":
		return "image/png"
	case "webp":
		return "image/webp"
	case "zip":
		return "application/zip"
	default:
		return "application/octet-stream"
	}
}
