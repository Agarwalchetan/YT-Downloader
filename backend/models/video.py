"""
Video Models - Data structures for video metadata and formats.
This layer handles data representation only, no HTTP or UI concerns.
"""

from pydantic import BaseModel, Field
from typing import List, Optional
from enum import Enum


class FormatType(str, Enum):
    """Video format types"""
    VIDEO_ONLY = "video_only"
    AUDIO_ONLY = "audio_only"
    VIDEO_AUDIO = "video_audio"


class DownloadType(str, Enum):
    """Download type options"""
    VIDEO = "video"
    AUDIO = "audio"


class QualityOption(BaseModel):
    """Represents a quality option for download"""
    quality_id: str
    label: str  # e.g., "1080p", "720p", "320kbps"
    resolution: Optional[str] = None  # For video
    height: Optional[int] = None  # For sorting
    bitrate: Optional[int] = None  # For audio (kbps)
    filesize_approx: Optional[int] = None
    format_type: DownloadType


class VideoFormat(BaseModel):
    """Represents a single video/audio format option"""
    format_id: str
    extension: str
    resolution: Optional[str] = None
    filesize: Optional[int] = None
    filesize_approx: Optional[int] = None
    format_note: Optional[str] = None
    fps: Optional[float] = None
    vcodec: Optional[str] = None
    acodec: Optional[str] = None
    format_type: FormatType
    tbr: Optional[float] = None  # Total bitrate
    
    @property
    def display_size(self) -> str:
        """Human-readable file size"""
        size = self.filesize or self.filesize_approx
        if not size:
            return "Unknown"
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size < 1024:
                return f"{size:.1f} {unit}"
            size /= 1024
        return f"{size:.1f} TB"


class VideoInfo(BaseModel):
    """Complete video metadata"""
    id: str
    title: str
    description: Optional[str] = None
    duration: Optional[int] = None  # Duration in seconds
    thumbnail: Optional[str] = None
    uploader: Optional[str] = None
    uploader_url: Optional[str] = None
    view_count: Optional[int] = None
    like_count: Optional[int] = None
    upload_date: Optional[str] = None
    webpage_url: str
    formats: List[VideoFormat] = []
    best_video_format: Optional[VideoFormat] = None
    best_audio_format: Optional[VideoFormat] = None
    
    @property
    def duration_formatted(self) -> str:
        """Human-readable duration"""
        if not self.duration:
            return "Unknown"
        hours, remainder = divmod(self.duration, 3600)
        minutes, seconds = divmod(remainder, 60)
        if hours:
            return f"{hours}:{minutes:02d}:{seconds:02d}"
        return f"{minutes}:{seconds:02d}"


class DownloadRequest(BaseModel):
    """Request model for video download"""
    url: str = Field(..., description="Video URL to download")
    download_type: DownloadType = Field(default=DownloadType.VIDEO, description="Type of download: video or audio")
    quality: Optional[str] = Field(default=None, description="Quality ID to download (e.g., '1080p', '720p', '320kbps')")


class VideoInfoRequest(BaseModel):
    """Request model for fetching video info"""
    url: str = Field(..., description="Video URL to fetch info for")


class DownloadProgress(BaseModel):
    """Download progress information"""
    status: str
    downloaded_bytes: Optional[int] = None
    total_bytes: Optional[int] = None
    speed: Optional[float] = None
    eta: Optional[int] = None
    percentage: Optional[float] = None
    filename: Optional[str] = None


class ApiResponse(BaseModel):
    """Standard API response wrapper"""
    success: bool
    message: Optional[str] = None
    data: Optional[dict] = None
    error: Optional[str] = None


class ServerStatus(BaseModel):
    """Server status information"""
    backend: bool = False
    ffmpeg: bool = False
    ytdlp: bool = False
    ytdlp_version: Optional[str] = None
