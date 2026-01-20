"""
Download Controller - API endpoints for video info and download.
Handles HTTP requests, validation, and response streaming.
This layer stays thin - business logic is in services.
"""

import os
import re
from urllib.parse import urlparse
from typing import Generator

from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse, JSONResponse

from models.video import (
    VideoInfoRequest, 
    DownloadRequest, 
    ApiResponse, 
    DownloadType,
    ServerStatus
)
from services.ytdlp_service import get_ytdlp_service
from utils.file_cleanup import cleanup_file_after_response

router = APIRouter(prefix="/api", tags=["download"])


def validate_url(url: str) -> bool:
    """
    Validate that the URL is a valid video URL.
    
    Args:
        url: URL to validate
        
    Returns:
        True if valid, False otherwise
    """
    if not url or not isinstance(url, str):
        return False
    
    try:
        parsed = urlparse(url)
        # Must have scheme and netloc
        if not parsed.scheme or not parsed.netloc:
            return False
        # Must be http or https
        if parsed.scheme not in ('http', 'https'):
            return False
        return True
    except Exception:
        return False


def file_iterator(file_path: str, chunk_size: int = 8192) -> Generator[bytes, None, None]:
    """
    Generator that yields file chunks for streaming.
    
    Args:
        file_path: Path to the file to stream
        chunk_size: Size of each chunk in bytes
        
    Yields:
        Bytes chunks of the file
    """
    with open(file_path, 'rb') as f:
        while chunk := f.read(chunk_size):
            yield chunk


@router.get("/status")
async def get_server_status():
    """
    Get server status including all dependencies.
    
    Returns:
        Server status with backend, FFmpeg, and yt-dlp availability
    """
    service = get_ytdlp_service()
    status = service.get_server_status()
    
    return {
        "backend": status.backend,
        "ffmpeg": status.ffmpeg,
        "ytdlp": status.ytdlp,
        "ytdlp_version": status.ytdlp_version
    }


@router.post("/info")
async def get_video_info(request: VideoInfoRequest):
    """
    Fetch video metadata without downloading.
    
    Args:
        request: Contains the video URL
        
    Returns:
        Video metadata including title, duration, thumbnail, and available formats
    """
    if not validate_url(request.url):
        raise HTTPException(
            status_code=400,
            detail="Invalid URL. Please provide a valid video URL."
        )
    
    service = get_ytdlp_service()
    
    try:
        video_info = await service.fetch_video_info(request.url)
        
        # Get available quality options
        raw_formats = [
            {
                'height': f.resolution.split('x')[-1] if f.resolution and 'x' in f.resolution else None,
                'vcodec': f.vcodec,
                'acodec': f.acodec,
                'abr': f.tbr,
                'tbr': f.tbr,
            }
            for f in video_info.formats
        ]
        
        # Convert height strings to integers where possible
        for fmt in raw_formats:
            if fmt['height']:
                try:
                    fmt['height'] = int(fmt['height'].replace('p', ''))
                except (ValueError, AttributeError):
                    fmt['height'] = None
        
        video_qualities = service.get_available_video_qualities(raw_formats)
        audio_qualities = service.get_available_audio_qualities(raw_formats)
        
        return ApiResponse(
            success=True,
            message="Video info fetched successfully",
            data={
                "id": video_info.id,
                "title": video_info.title,
                "description": video_info.description[:500] if video_info.description else None,
                "duration": video_info.duration,
                "duration_formatted": video_info.duration_formatted,
                "thumbnail": video_info.thumbnail,
                "uploader": video_info.uploader,
                "view_count": video_info.view_count,
                "upload_date": video_info.upload_date,
                "webpage_url": video_info.webpage_url,
                "best_video": {
                    "resolution": video_info.best_video_format.resolution,
                    "format_note": video_info.best_video_format.format_note,
                    "fps": video_info.best_video_format.fps,
                } if video_info.best_video_format else None,
                "best_audio": {
                    "format_note": video_info.best_audio_format.format_note,
                } if video_info.best_audio_format else None,
                "video_qualities": [
                    {
                        "quality_id": q.quality_id,
                        "label": q.label,
                        "resolution": q.resolution,
                        "height": q.height,
                    }
                    for q in video_qualities
                ],
                "audio_qualities": [
                    {
                        "quality_id": q.quality_id,
                        "label": q.label,
                        "bitrate": q.bitrate,
                    }
                    for q in audio_qualities
                ],
            }
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch video info: {str(e)}"
        )


@router.post("/download")
async def download_video(request: DownloadRequest, background_tasks: BackgroundTasks):
    """
    Download video or audio with specified quality.
    
    Args:
        request: Contains the video URL, download type, and quality
        background_tasks: FastAPI background tasks for cleanup
        
    Returns:
        Streaming response with the video/audio file
    """
    if not validate_url(request.url):
        raise HTTPException(
            status_code=400,
            detail="Invalid URL. Please provide a valid video URL."
        )
    
    service = get_ytdlp_service()
    
    try:
        # Download with specified options
        file_path, filename = await service.download_with_quality(
            url=request.url,
            download_type=request.download_type,
            quality=request.quality
        )
        
        # Get file size for Content-Length header
        file_size = os.path.getsize(file_path)
        
        # Determine content type based on extension
        ext = os.path.splitext(file_path)[1].lower()
        content_types = {
            '.mp4': 'video/mp4',
            '.mkv': 'video/x-matroska',
            '.webm': 'video/webm',
            '.avi': 'video/x-msvideo',
            '.mp3': 'audio/mpeg',
            '.m4a': 'audio/mp4',
            '.opus': 'audio/opus',
            '.ogg': 'audio/ogg',
        }
        content_type = content_types.get(ext, 'application/octet-stream')
        
        # Schedule file cleanup after response is sent
        background_tasks.add_task(cleanup_file_after_response, file_path, delay_seconds=300)
        
        # Sanitize filename for Content-Disposition header
        safe_filename = re.sub(r'[^\w\s\-_\.]', '_', filename)
        
        return StreamingResponse(
            file_iterator(file_path),
            media_type=content_type,
            headers={
                'Content-Disposition': f'attachment; filename="{safe_filename}"',
                'Content-Length': str(file_size),
                'X-Content-Type-Options': 'nosniff',
            }
        )
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Download failed: {str(e)}"
        )


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "yt-downloader"}
