# YT-Downloader

A full-stack web application for downloading videos in maximum quality. Built with FastAPI (backend) and Next.js (frontend).

**For educational and personal use only.**

## Features

- Download videos in maximum available quality
- Automatic merging of best video + best audio streams
- Clean REST API with FastAPI
- Modern React frontend with Next.js and Tailwind CSS
- Real-time download progress
- Automatic temporary file cleanup

## Tech Stack

### Backend
- Python 3.10+
- FastAPI
- yt-dlp
- FFmpeg

### Frontend
- React 18
- Next.js 14
- Tailwind CSS
- Axios
- Lucide Icons

## Project Structure

```
yt-downloader/
├── backend/
│   ├── main.py                 # FastAPI application entry
│   ├── controllers/
│   │   └── download_controller.py  # API endpoints
│   ├── models/
│   │   └── video.py            # Data models (Pydantic)
│   ├── services/
│   │   └── ytdlp_service.py    # Business logic (yt-dlp)
│   └── utils/
│       └── file_cleanup.py     # Temp file management
│
├── frontend/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── UrlInput.tsx
│   │   ├── VideoInfo.tsx
│   │   ├── DownloadButton.tsx
│   │   └── ErrorMessage.tsx
│   └── lib/
│       └── api.ts              # API client
│
├── requirements.txt
├── README.md
└── DISCLAIMER.md
```

## Prerequisites

1. **Python 3.10+** - [Download](https://www.python.org/downloads/)
2. **Node.js 18+** - [Download](https://nodejs.org/)
3. **FFmpeg** - Required for video/audio merging
   - Windows: `winget install FFmpeg`
   - macOS: `brew install ffmpeg`
   - Linux: `sudo apt install ffmpeg`

## Installation

### Backend Setup

```bash
# Navigate to project root
cd yt-downloader

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install
```

## Running the Application

### Start Backend Server

```bash
# From the backend directory
cd backend
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`

API Documentation: `http://localhost:8000/docs`

### Start Frontend Development Server

```bash
# From the frontend directory
cd frontend
npm run dev
```

The frontend will be available at `http://localhost:3000`

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/info` | Fetch video metadata |
| POST | `/api/download` | Download video in best quality |
| GET | `/api/health` | Health check |

### Example: Fetch Video Info

```bash
curl -X POST http://localhost:8000/api/info \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.youtube.com/watch?v=VIDEO_ID"}'
```

### Example: Download Video

```bash
curl -X POST http://localhost:8000/api/download \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.youtube.com/watch?v=VIDEO_ID"}' \
  --output video.mp4
```

## Architecture

This project follows an MVC-like architecture:

- **Model** (`models/`): Data structures and validation (Pydantic models)
- **View** (`frontend/`): React UI components
- **Controller** (`controllers/`): HTTP request handling, thin layer
- **Service** (`services/`): Business logic, yt-dlp integration

### Data Flow

```
User Input → Frontend → API Controller → Service (yt-dlp) → FFmpeg → Stream → Download
```

## Configuration

### Environment Variables

Create `.env` files for configuration:

**Backend** (optional):
```env
# No required env vars, but you can customize:
# DOWNLOAD_DIR=/path/to/temp/downloads
```

**Frontend** (`frontend/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Development Notes

- Downloaded files are stored temporarily and cleaned up automatically
- The backend uses async/await for non-blocking I/O
- CORS is configured for local development (localhost:3000)
- The frontend uses client-side rendering for the download page

## Troubleshooting

### FFmpeg not found
Ensure FFmpeg is installed and in your system PATH:
```bash
ffmpeg -version
```

### CORS errors
Make sure the backend is running on port 8000 and the frontend on port 3000.

### Download fails
- Check the video URL is valid and accessible
- Some videos may have restrictions
- Check backend logs for detailed error messages

## License

This project is for educational purposes only. See [DISCLAIMER.md](DISCLAIMER.md).

## Contributing

This is an educational project. Feel free to fork and modify for learning purposes.
