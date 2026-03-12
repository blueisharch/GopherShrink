.PHONY: dev-backend dev-frontend dev install-frontend tidy

## Run the Go API server
dev-backend:
	cd backend && go run ./cmd/server

## Run the Vite dev server
dev-frontend:
	cd frontend && npm run dev

## Run both concurrently (requires: npm i -g concurrently)
dev:
	concurrently \
		"make dev-backend" \
		"make dev-frontend"

## Install frontend deps
install-frontend:
	cd frontend && npm install

## Tidy Go modules
tidy:
	cd backend && go mod tidy

## Build production frontend
build-frontend:
	cd frontend && npm run build

## Build Go binary
build-backend:
	cd backend && go build -o bin/gophershrink ./cmd/server

## Build everything
build: build-frontend build-backend
