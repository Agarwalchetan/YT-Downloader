# YT-Downloader

A full-stack video downloader built with **FastAPI** and **Next.js 14**. Paste any video URL, pick a quality, and download — video and audio streams are automatically merged via FFmpeg.

> **For educational and personal use only.** See [DISCLAIMER.md](DISCLAIMER.md).

**Author:** [Chetan Agarwal](https://github.com/Agarwalchetan)

---

## Features

- Download video + audio in maximum available quality (up to 4K)
- Automatic FFmpeg stream merging — separate video and audio tracks merged into a single file
- Audio-only extraction to MP3 at selectable bitrates (64 – 320 kbps)
- Quality selector — choose exact resolution or bitrate, or let it auto-pick the best
- Live dependency health bar — shows backend, FFmpeg, and yt-dlp status in the UI
- Supports 1000+ platforms via yt-dlp (YouTube, Vimeo, Twitter/X, Instagram, and more)
- Real-time download progress with shimmer progress bar
- Automatic temp file cleanup — files deleted 5 minutes after download, plus a background sweep every 15 minutes
- Clean dark UI with cyan accent — built with Tailwind CSS

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend framework | Python 3.10+, FastAPI, Uvicorn |
| Video extraction | yt-dlp |
| Stream merging | FFmpeg |
| Data validation | Pydantic v2 |
| Frontend framework | Next.js 14 (App Router), React 18 |
| Styling | Tailwind CSS v3, custom CSS design system |
| HTTP client | Axios |
| Icons | Lucide React |
| Language | TypeScript |

---

## Project Structure

```
yt-downloader/
├── backend/
│   ├── main.py                      # App entry point, CORS, lifespan, router mount
│   ├── controllers/
│   │   └── download_controller.py   # HTTP route handlers (thin layer)
│   ├── models/
│   │   └── video.py                 # All Pydantic models and enums
│   ├── services/
│   │   └── ytdlp_service.py         # Core business logic (yt-dlp + FFmpeg)
│   ├── utils/
│   │   └── file_cleanup.py          # Temp file lifecycle management
│   └── temp_downloads/              # Transient download storage (git-ignored)
│
├── frontend/
│   ├── app/
│   │   ├── layout.tsx               # Root HTML layout, Inter font, SEO metadata
│   │   ├── page.tsx                 # Main page — all state and event handlers
│   │   └── globals.css              # Global CSS and custom design system
│   ├── components/
│   │   ├── UrlInput.tsx             # URL input with fetch button
│   │   ├── VideoInfo.tsx            # Metadata card (thumbnail, stats, badges)
│   │   ├── QualitySelector.tsx      # Video/audio toggle + quality dropdown
│   │   ├── DownloadButton.tsx       # Hero CTA with progress bar
│   │   ├── ErrorMessage.tsx         # Dismissible error alert
│   │   ├── ServerStatusBar.tsx      # Live dependency health (backend/FFmpeg/yt-dlp)
│   │   └── GitHubStats.tsx          # Live GitHub stars/forks/watchers
│   └── lib/
│       └── api.ts                   # Typed Axios API client
│
├── requirements.txt
├── README.md
├── API.md                           # Full API reference
├── CONTRIBUTING.md                  # Development guide
└── DISCLAIMER.md                    # Legal notice
```

---

## Prerequisites

| Requirement | Version | Notes |
|-------------|---------|-------|
| Python | 3.10+ | [python.org](https://www.python.org/downloads/) |
| Node.js | 18+ | [nodejs.org](https://nodejs.org/) |
| FFmpeg | any recent | Required for HD merging and MP3 extraction |

### Install FFmpeg

```bash
# Windows (winget)
winget install FFmpeg

# Windows (Chocolatey)
choco install ffmpeg

# macOS
brew install ffmpeg

# Ubuntu / Debian
sudo apt install ffmpeg

# Arch Linux
sudo pacman -S ffmpeg
```

Verify it works:

```bash
ffmpeg -version
```

> **Without FFmpeg:** The app still works but falls back to yt-dlp's single-stream "best" format. You won't get separate HD video + audio merged together, and audio extraction to MP3 will fail.

---

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/Agarwalchetan/YT-Downloader.git
cd YT-Downloader
```

### 2. Backend setup

```bash
# Create and activate a virtual environment
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt
```

### 3. Frontend setup

```bash
cd frontend
npm install
```

---

## Running

You need two terminals — one for the backend, one for the frontend.

### Terminal 1 — Backend

```bash
# From the project root (with venv active)
cd backend
uvicorn main:app --reload --port 8000
```

- API base: `http://localhost:8000`
- Interactive docs: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### Terminal 2 — Frontend

```bash
cd frontend
npm run dev
```

- App: `http://localhost:3000`

---

## Configuration

### Frontend environment variables

Create `frontend/.env.local`:

```env
# Backend API URL (defaults to http://localhost:8000 if not set)
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Backend environment variables

The backend has no required environment variables. The download directory is resolved automatically to `backend/temp_downloads/` relative to the source files.

---

## API Reference

See [API.md](API.md) for the full API reference including request/response schemas, quality option values, and curl examples.

**Quick overview:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/status` | Dependency health check (backend, FFmpeg, yt-dlp) |
| `POST` | `/api/info` | Fetch video metadata without downloading |
| `POST` | `/api/download` | Download video or audio file |
| `GET` | `/api/health` | Simple liveness probe |

---

## Architecture

The backend follows an MVC-like layered pattern:

```
┌─────────────────────────────────────────────────────────┐
│  Frontend (Next.js)                                      │
│  page.tsx → lib/api.ts (Axios) → HTTP                   │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP (JSON / blob stream)
┌──────────────────────▼──────────────────────────────────┐
│  Controller layer  (controllers/download_controller.py)  │
│  Route handling, request validation, response building   │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│  Service layer  (services/ytdlp_service.py)              │
│  yt-dlp extraction, FFmpeg merging, format selection     │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│  Models  (models/video.py)                               │
│  Pydantic schemas, enums, computed properties            │
└─────────────────────────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│  Utils  (utils/file_cleanup.py)                          │
│  Background thread cleanup, per-request deletion         │
└─────────────────────────────────────────────────────────┘
```

### Download flow

```
User pastes URL
  → Frontend calls POST /api/info
  → yt-dlp extracts metadata (thread pool, non-blocking)
  → UI shows thumbnail, title, quality options

User clicks Download
  → Frontend calls POST /api/download
  → yt-dlp downloads stream(s) to temp_downloads/
  → FFmpeg merges video + audio (if applicable)
  → Backend streams file to browser as blob
  → Frontend creates object URL → triggers <a> click → file saved
  → BackgroundTask schedules file deletion after 5 minutes
```

### File cleanup — two layers

1. **Per-request** — After each download response finishes streaming, a `BackgroundTask` schedules deletion of that specific file after 300 seconds.
2. **Global sweep** — A daemon thread started at app startup scans `temp_downloads/` every 15 minutes and deletes any media file older than 30 minutes. Only files with known media extensions are touched (`.mp4`, `.mkv`, `.webm`, `.mp3`, `.m4a`, `.opus`, `.part`, `.tmp`).

---

## Troubleshooting

### FFmpeg not found in status bar

FFmpeg is installed but not on your PATH. Add the FFmpeg `bin/` directory to your system `PATH` environment variable and restart the backend.

```bash
# Verify it's accessible:
ffmpeg -version
```

### CORS errors in browser console

The backend only allows `localhost:3000` and `localhost:3001` by default. Make sure:
- Backend is running on port `8000`
- Frontend is running on port `3000`

If you changed ports, update the `allow_origins` list in `backend/main.py`.

### Download fails with "Requested format is not available"

yt-dlp's format availability depends on the platform and the video. Try:
- Selecting a lower quality in the Quality dropdown
- Choosing "Best Quality (Auto)" which lets yt-dlp pick the best available format

### Video downloads as `.webm` instead of `.mp4`

This happens when FFmpeg is not installed. Install FFmpeg to enable proper MP4 merging.

### "Failed to fetch video info" for YouTube

YouTube periodically changes its API. Update yt-dlp:

```bash
pip install --upgrade yt-dlp
```

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the development guide, project conventions, and how to submit changes.

---

## License

This project is for educational purposes only. See [DISCLAIMER.md](DISCLAIMER.md) for the full legal notice.
