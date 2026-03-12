# 🐹 GopherShrink

> Lightning-fast, web-based image optimization — Go concurrency backend × React + GSAP frontend.

[![Go](https://img.shields.io/badge/Go-1.22-00ADD8?logo=go)](https://go.dev)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://typescriptlang.org)
[![Tailwind](https://img.shields.io/badge/Tailwind-3-06B6D4?logo=tailwindcss)](https://tailwindcss.com)

---

## ✨ Features

| Feature | Detail |
|---|---|
| **Batch processing** | Upload a folder; download a single `.zip` |
| **Lossy / Lossless** | Toggle per-batch |
| **WebP conversion** | Auto-offer `.webp` output for any JPG/PNG |
| **Metadata stripping** | Remove EXIF / GPS / timestamps |
| **Before/After slider** | Visual quality comparison |
| **Real-time stats** | Exact bytes saved + percentage |
| **Worker pool** | `runtime.NumCPU()` goroutines, no CPU exhaustion |
| **TTL cleanup** | In-memory files auto-expire after 30 min |

---

## 🗂 Project Structure

```
GopherShrink/
├── backend/                        # Go API server
│   ├── cmd/server/main.go          # Entry point
│   ├── internal/
│   │   ├── api/
│   │   │   ├── handlers/           # HTTP request handlers
│   │   │   ├── middleware/         # Logger, recoverer, body-limit
│   │   │   └── routes/             # Chi router wiring
│   │   ├── config/                 # Env-based configuration
│   │   ├── models/                 # Shared data types
│   │   ├── processor/              # Image decode/resize/encode engine
│   │   └── worker/                 # Fixed-size goroutine pool
│   └── pkg/
│       ├── compression/            # In-memory TTL store
│       ├── fileutil/               # MIME detection, temp files
│       └── ziputil/                # ZIP archive creation
│
└── frontend/                       # React + TypeScript SPA
    └── src/
        ├── components/
        │   ├── dropzone/           # Drag-and-drop upload zone
        │   ├── preview/            # Before/After slider
        │   ├── queue/              # File list + per-item row
        │   ├── stats/              # Settings panel + stats summary
        │   └── ui/                 # Reusable UI (ProgressCircle)
        ├── hooks/                  # useCompress, useDrop
        ├── services/               # API client (fetch wrappers)
        ├── store/                  # Zustand global state
        ├── styles/                 # Global CSS + Tailwind
        ├── types/                  # Shared TypeScript interfaces
        └── utils/                  # fileUtils, GSAP animations
```

---

## 🚀 Getting Started

### Backend

```bash
cd backend
go mod download
go run ./cmd/server

# Server starts on :8080
# Env vars: PORT, WORKER_COUNT, MAX_FILE_SIZE_MB
```

### Frontend

```bash
cd frontend
npm install
npm run dev

# Dev server starts on :5173 and proxies /api → :8080
```

---

## 🔌 API Reference

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/health` | Service health + worker count |
| `POST` | `/api/v1/compress` | Single image compression |
| `POST` | `/api/v1/batch` | Multi-file → zip |
| `GET` | `/api/v1/download/:fileID` | Download compressed file |

### `POST /api/v1/compress` form fields

| Field | Type | Default | Description |
|---|---|---|---|
| `file` | File | required | Image file (JPG/PNG/WebP) |
| `quality` | int | 82 | 1-100, lossy quality |
| `mode` | string | `lossy` | `lossy` or `lossless` |
| `output_format` | string | auto | `jpeg`, `png`, `webp` |
| `strip_metadata` | bool | false | Remove EXIF data |
| `max_width` | int | 0 | Max output width (0 = no resize) |
| `max_height` | int | 0 | Max output height (0 = no resize) |

---

## 🛠 Tech Stack

**Backend**: Go 1.22 · chi · disintegration/imaging · golang.org/x/image  
**Frontend**: React 18 · TypeScript 5 · Zustand · GSAP 3 · Tailwind CSS 3 · Vite

---

## 👤 Author

**Gouranga Das Samrat** — [@GourangaDasSamrat](https://github.com/GourangaDasSamrat)
