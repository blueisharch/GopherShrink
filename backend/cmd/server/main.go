package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/GourangaDasSamrat/gophershrink/internal/api/routes"
	"github.com/GourangaDasSamrat/gophershrink/internal/config"
	"github.com/GourangaDasSamrat/gophershrink/internal/worker"
)

func main() {
	cfg := config.Load()

	pool := worker.NewPool(cfg.WorkerCount)
	pool.Start()
	defer pool.Stop()

	r := routes.Register(pool, cfg)

	srv := &http.Server{
		Addr:         fmt.Sprintf(":%s", cfg.Port),
		Handler:      r,
		ReadTimeout:  cfg.ReadTimeout,
		WriteTimeout: cfg.WriteTimeout,
		IdleTimeout:  cfg.IdleTimeout,
	}

	go func() {
		log.Printf("[GopherShrink] Server starting on port %s with %d workers\n", cfg.Port, cfg.WorkerCount)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server error: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("[GopherShrink] Shutting down gracefully...")
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("Forced shutdown: %v", err)
	}
	log.Println("[GopherShrink] Server stopped.")
}
