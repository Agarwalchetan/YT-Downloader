# API Reference

Base URL: `http://localhost:8000`

Interactive docs (Swagger UI): `http://localhost:8000/docs`

All endpoints are under the `/api` prefix except the root.

---

## Table of Contents

- [GET /](#get-)
- [GET /api/status](#get-apistatus)
- [GET /api/health](#get-apihealth)
- [POST /api/info](#post-apiinfo)
- [POST /api/download](#post-apidownload)
- [Data Types](#data-types)
- [Quality Values](#quality-values)
- [Error Handling](#error-handling)

---

## GET /

Root endpoint. Returns API metadata.

**Response `200`**

```json
{
  "name": "YT-Downloader API",
  "version": "1.0.0",
  "description": "Video downloader API powered by yt-dlp",
  "endpoints": {
    "status": "/api/status",
    "info": "/api/info",
    "download": "/api/download",
    "health": "/api/health",
    "docs": "/docs"
  }
}
```

---

## GET /api/status

Returns the live health status of all backend dependencies.

**Response `200`**

```json
{
  "backend": true,
  "ffmpeg": true,
  "ytdlp": true,
  "ytdlp_version": "2024.12.13"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `backend` | `boolean` | Always `true` if the server is reachable |
| `ffmpeg` | `boolean` | `true` if FFmpeg is found on the system PATH |
| `ytdlp` | `boolean` | `true` if yt-dlp is importable |
| `ytdlp_version` | `string \| null` | Installed yt-dlp version string, or `null` if unavailable |

**curl example**

```bash
curl http://localhost:8000/api/status
```

---

## GET /api/health

Simple liveness probe. Use this for uptime monitors or Docker health checks.

**Response `200`**

```json
{
  "status": "healthy",
  "service": "yt-downloader"
}
```

**curl example**

```bash
curl http://localhost:8000/api/health
```

---

## POST /api/info

Fetches video metadata without downloading anything. Returns the video title, thumbnail, duration, view count, uploader, and available quality options.

**Request body**

```json
{
  "url": "https://www.youtube.com/watch?v=VIDEO_ID"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `url` | `string` | Yes | Any URL supported by yt-dlp |

**Response `200`**

```json
{
  "success": true,
  "message": "Video info fetched successfully",
  "data": {
    "id": "dQw4w9WgXcQ",
    "title": "Rick Astley - Never Gonna Give You Up",
    "description": "The official video for "Never Gonna Give You Up"…",
    "duration": 212,
    "duration_formatted": "3:32",
    "thumbnail": "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    "uploader": "Rick Astley",
    "view_count": 1500000000,
    "upload_date": "20091025",
    "webpage_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "best_video": {
      "resolution": "1920x1080",
      "format_note": "1080p",
      "fps": 25.0
    },
    "best_audio": {
      "format_note": "medium"
    },
    "video_qualities": [
      { "quality_id": "1080p", "label": "Full HD (1080p)", "resolution": "1080p", "height": 1080, "bitrate": null },
      { "quality_id": "720p",  "label": "HD (720p)",       "resolution": "720p",  "height": 720,  "bitrate": null },
      { "quality_id": "480p",  "label": "SD (480p)",       "resolution": "480p",  "height": 480,  "bitrate": null },
      { "quality_id": "360p",  "label": "Low (360p)",      "resolution": "360p",  "height": 360,  "bitrate": null }
    ],
    "audio_qualities": [
      { "quality_id": "128kbps", "label": "Standard (128 kbps)", "resolution": null, "height": null, "bitrate": 128 },
      { "quality_id": "96kbps",  "label": "Low (96 kbps)",       "resolution": null, "height": null, "bitrate": 96 }
    ]
  },
  "error": null
}
```

**Error `400`** — Invalid URL or yt-dlp extraction failure

```json
{
  "detail": "Invalid URL: missing scheme or host"
}
```

**curl example**

```bash
curl -X POST http://localhost:8000/api/info \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'
```

---

## POST /api/download

Downloads a video or audio file. Returns the file as a binary stream with `Content-Disposition: attachment` headers so browsers prompt a file save dialog.

> **Note:** This endpoint can take several minutes for large files. The frontend Axios client has a 5-minute timeout.

**Request body**

```json
{
  "url": "https://www.youtube.com/watch?v=VIDEO_ID",
  "download_type": "video",
  "quality": "1080p"
}
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `url` | `string` | Yes | — | Any URL supported by yt-dlp |
| `download_type` | `"video" \| "audio"` | No | `"video"` | Download mode |
| `quality` | `string` | No | auto-best | Quality identifier — see [Quality Values](#quality-values) |

**Response `200`** — Binary file stream

```
Content-Disposition: attachment; filename="Rick Astley - Never Gonna Give You Up.mp4"
Content-Length: 48291840
Content-Type: video/mp4
X-Content-Type-Options: nosniff
```

The response body is the raw file bytes. The frontend handles this by collecting the blob and triggering a browser download.

**Response content types by format**

| Extension | Content-Type |
|-----------|-------------|
| `.mp4` | `video/mp4` |
| `.webm` | `video/webm` |
| `.mkv` | `video/x-matroska` |
| `.mp3` | `audio/mpeg` |
| `.m4a` | `audio/mp4` |
| `.opus` | `audio/opus` |

**Error `400`** — Invalid URL or format not available

```json
{
  "detail": "ERROR: [youtube] VIDEO_ID: Requested format is not available"
}
```

**Error `500`** — Internal error during download

```json
{
  "detail": "Download failed: <error message>"
}
```

**curl examples**

Download best quality video:
```bash
curl -X POST http://localhost:8000/api/download \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}' \
  --output video.mp4
```

Download 720p video:
```bash
curl -X POST http://localhost:8000/api/download \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "download_type": "video", "quality": "720p"}' \
  --output video_720p.mp4
```

Download audio as MP3 at 320 kbps:
```bash
curl -X POST http://localhost:8000/api/download \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "download_type": "audio", "quality": "320kbps"}' \
  --output audio.mp3
```

---

## Data Types

### VideoInfo object

Returned inside the `data` field of the `POST /api/info` response.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Platform-specific video identifier |
| `title` | `string` | Video title |
| `description` | `string \| null` | Video description, truncated at 500 characters |
| `duration` | `number \| null` | Duration in seconds |
| `duration_formatted` | `string` | Human-readable duration (`"3:32"` or `"1:02:45"`) |
| `thumbnail` | `string \| null` | Thumbnail URL |
| `uploader` | `string \| null` | Channel or uploader name |
| `view_count` | `number \| null` | Total view count |
| `upload_date` | `string \| null` | Upload date as `YYYYMMDD` string (e.g. `"20231015"`) |
| `webpage_url` | `string` | Canonical URL of the video |
| `best_video` | `BestVideo \| null` | Best available video format summary |
| `best_audio` | `BestAudio \| null` | Best available audio format summary |
| `video_qualities` | `QualityOption[]` | List of available video quality tiers |
| `audio_qualities` | `QualityOption[]` | List of available audio bitrate tiers |

### BestVideo object

| Field | Type | Description |
|-------|------|-------------|
| `resolution` | `string` | Resolution string (e.g. `"1920x1080"`) |
| `format_note` | `string \| null` | yt-dlp format note (e.g. `"1080p"`) |
| `fps` | `number \| null` | Frame rate |

### BestAudio object

| Field | Type | Description |
|-------|------|-------------|
| `format_note` | `string \| null` | yt-dlp format note (e.g. `"medium"`, `"high"`) |

### QualityOption object

| Field | Type | Description |
|-------|------|-------------|
| `quality_id` | `string` | The identifier to pass as `quality` in the download request |
| `label` | `string` | Human-readable label (e.g. `"Full HD (1080p)"`) |
| `resolution` | `string \| null` | Resolution string for video options |
| `height` | `number \| null` | Pixel height for video options |
| `bitrate` | `number \| null` | Bitrate in kbps for audio options |

---

## Quality Values

### Video quality IDs

Pass one of these as the `quality` field in `POST /api/download` with `download_type: "video"`.

| `quality` value | Label | Max resolution |
|----------------|-------|---------------|
| `"2160p"` | 4K (2160p) | 3840×2160 |
| `"1440p"` | QHD (1440p) | 2560×1440 |
| `"1080p"` | Full HD (1080p) | 1920×1080 |
| `"720p"` | HD (720p) | 1280×720 |
| `"480p"` | SD (480p) | 854×480 |
| `"360p"` | Low (360p) | 640×360 |
| `"240p"` | Very Low (240p) | 426×240 |
| `"144p"` | Minimum (144p) | 256×144 |

Only qualities available for the specific video are returned by `POST /api/info`. Requesting an unavailable quality results in a `400` error.

### Audio quality IDs

Pass one of these as the `quality` field in `POST /api/download` with `download_type: "audio"`.

| `quality` value | Label | Bitrate |
|----------------|-------|---------|
| `"320kbps"` | High (320 kbps) | 320 kbps |
| `"256kbps"` | High (256 kbps) | 256 kbps |
| `"192kbps"` | Standard (192 kbps) | 192 kbps |
| `"128kbps"` | Standard (128 kbps) | 128 kbps |
| `"96kbps"` | Low (96 kbps) | 96 kbps |
| `"64kbps"` | Low (64 kbps) | 64 kbps |

The audio qualities returned by `POST /api/info` are filtered to only include bitrates up to the maximum available in the source audio stream.

---

## Error Handling

All `4xx` and `5xx` errors return a JSON body with a `detail` field:

```json
{
  "detail": "Human-readable error message"
}
```

| Status | Cause |
|--------|-------|
| `400` | Invalid URL (missing scheme or host), yt-dlp `ValueError`, format not available |
| `500` | Unexpected server error during extraction or download |

The `POST /api/info` response also uses an `ApiResponse` envelope with `success: false` and an `error` string for application-level errors, in addition to HTTP status codes.
