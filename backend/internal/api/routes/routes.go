package routes

import (
	"net/http"
	"time"

	"github.com/GourangaDasSamrat/gophershrink/internal/api/handlers"
	mw "github.com/GourangaDasSamrat/gophershrink/internal/api/middleware"
	"github.com/GourangaDasSamrat/gophershrink/internal/config"
	"github.com/GourangaDasSamrat/gophershrink/internal/worker"
	"github.com/GourangaDasSamrat/gophershrink/pkg/compression"
	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

// Register wires up all routes and returns the root http.Handler.
func Register(pool *worker.Pool, cfg *config.Config) http.Handler {
	store := compression.NewStore(time.Duration(cfg.TTLMinutes) * time.Minute)
	h := handlers.New(pool, store, cfg.MaxFileSize)

	r := chi.NewRouter()

	// Global middleware
	r.Use(chimw.RequestID)
	r.Use(mw.Logger)
	r.Use(mw.Recoverer)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   cfg.AllowOrigins,
		AllowedMethods:   []string{"GET", "POST", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Content-Type", "X-Request-ID"},
		AllowCredentials: false,
		MaxAge:           300,
	}))

	// API v1
	r.Route("/api/v1", func(r chi.Router) {
		r.Use(mw.MaxBodySize(cfg.MaxFileSize * 25)) // headroom for batch
		r.Get("/health", h.Health)
		r.Post("/compress", h.Compress)
		r.Post("/batch", h.BatchCompress)
		r.Get("/download/{fileID}", h.Download)
	})

	return r
}
