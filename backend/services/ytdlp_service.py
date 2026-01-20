"""
YT-DLP Service - Core business logic for video extraction and download.
Handles all yt-dlp interactions, format selection, and FFmpeg merging.
"""

import os
import re
import uuid
import shutil
import tempfile
import asyncio
from typing import Optional, Callable, Dict, Any, List
from pathlib import Path

import yt_dlp

from models.video import (
    VideoInfo, 
    VideoFormat, 
    FormatType,
    DownloadType,
    DownloadProgress,
    QualityOption,
    ServerStatus
)


# Standard video quality options (height in pixels)
VIDEO_QUALITIES = [
    {"id": "2160p", "label": "4K (2160p)", "height": 2160},
    {"id": "1440p", "label": "2K (1440p)", "height": 1440},
    {"id": "1080p", "label": "Full HD (1080p)", "height": 1080},
    {"id": "720p", "label": "HD (720p)", "height": 720},
    {"id": "480p", "label": "SD (480p)", "height": 480},
    {"id": "360p", "label": "Low (360p)", "height": 360},
    {"id": "240p", "label": "Very Low (240p)", "height": 240},
    {"id": "144p", "label": "Minimum (144p)", "height": 144},
]

# Standard audio quality options (bitrate in kbps)
AUDIO_QUALITIES = [
    {"id": "320kbps", "label": "High (320 kbps)", "bitrate": 320},
    {"id": "256kbps", "label": "Good (256 kbps)", "bitrate": 256},
    {"id": "192kbps", "label": "Medium (192 kbps)", "bitrate": 192},
    {"id": "128kbps", "label": "Standard (128 kbps)", "bitrate": 128},
    {"id": "96kbps", "label": "Low (96 kbps)", "bitrate": 96},
    {"id": "64kbps", "label": "Very Low (64 kbps)", "bitrate": 64},
]


class YTDLPService:
    """Service class for yt-dlp operations"""
    
    def __init__(self, download_dir: Optional[str] = None):
        """
        Initialize the YT-DLP service.
        
        Args:
            download_dir: Directory for temporary downloads. Uses system temp if not specified.
        """
        self.download_dir = download_dir or tempfile.gettempdir()
        os.makedirs(self.download_dir, exist_ok=True)
    
    def _check_ffmpeg(self) -> bool:
        """Check if FFmpeg is available in the system PATH"""
        # First try shutil.which
        if shutil.which('ffmpeg') is not None:
            return True
        
        # Fallback: try to run ffmpeg directly
        import subprocess
        try:
            result = subprocess.run(
                ['ffmpeg', '-version'],
                capture_output=True,
                timeout=5
            )
            return result.returncode == 0
        except (subprocess.TimeoutExpired, FileNotFoundError, Exception):
            return False
    
    def get_server_status(self) -> ServerStatus:
        """Get the current server status including dependencies"""
        ytdlp_version = None
        try:
            ytdlp_version = yt_dlp.version.__version__
        except:
            pass
        
        return ServerStatus(
            backend=True,
            ffmpeg=self._check_ffmpeg(),
            ytdlp=ytdlp_version is not None,
            ytdlp_version=ytdlp_version
        )
    
    def get_available_video_qualities(self, formats: List[dict]) -> List[QualityOption]:
        """
        Get available video quality options based on video formats.
        
        Args:
            formats: Raw format list from yt-dlp
            
        Returns:
            List of available quality options (sorted high to low)
        """
        available_heights = set()
        
        for fmt in formats:
            height = fmt.get('height')
            vcodec = fmt.get('vcodec', 'none')
            if height and vcodec and vcodec != 'none':
                available_heights.add(height)
        
        quality_options = []
        for q in VIDEO_QUALITIES:
            # Find the closest available height
            closest_height = min(available_heights, key=lambda h: abs(h - q["height"]), default=None)
            if closest_height and abs(closest_height - q["height"]) <= 100:  # Within 100px tolerance
                quality_options.append(QualityOption(
                    quality_id=q["id"],
                    label=q["label"],
                    resolution=f"{closest_height}p",
                    height=closest_height,
                    format_type=DownloadType.VIDEO
                ))
                available_heights.discard(closest_height)
        
        return quality_options
    
    def get_available_audio_qualities(self, formats: List[dict]) -> List[QualityOption]:
        """
        Get available audio quality options based on audio formats.
        
        Args:
            formats: Raw format list from yt-dlp
            
        Returns:
            List of available quality options (sorted high to low)
        """
        max_bitrate = 0
        
        for fmt in formats:
            acodec = fmt.get('acodec', 'none')
            if acodec and acodec != 'none':
                abr = fmt.get('abr', 0) or fmt.get('tbr', 0) or 0
                if abr > max_bitrate:
                    max_bitrate = abr
        
        # Return audio qualities up to the max available
        quality_options = []
        for q in AUDIO_QUALITIES:
            if q["bitrate"] <= max_bitrate + 50:  # 50kbps tolerance
                quality_options.append(QualityOption(
                    quality_id=q["id"],
                    label=q["label"],
                    bitrate=q["bitrate"],
                    format_type=DownloadType.AUDIO
                ))
        
        # If no qualities matched, add at least the standard quality
        if not quality_options:
            quality_options.append(QualityOption(
                quality_id="128kbps",
                label="Standard (128 kbps)",
                bitrate=128,
                format_type=DownloadType.AUDIO
            ))
        
        return quality_options
    
    def _get_format_type(self, format_info: dict) -> FormatType:
        """Determine the format type based on codecs"""
        vcodec = format_info.get('vcodec', 'none')
        acodec = format_info.get('acodec', 'none')
        
        has_video = vcodec and vcodec != 'none'
        has_audio = acodec and acodec != 'none'
        
        if has_video and has_audio:
            return FormatType.VIDEO_AUDIO
        elif has_video:
            return FormatType.VIDEO_ONLY
        else:
            return FormatType.AUDIO_ONLY
    
    def _parse_format(self, fmt: dict) -> VideoFormat:
        """Parse yt-dlp format dict into VideoFormat model"""
        return VideoFormat(
            format_id=fmt.get('format_id', ''),
            extension=fmt.get('ext', ''),
            resolution=fmt.get('resolution') or f"{fmt.get('width', '?')}x{fmt.get('height', '?')}",
            filesize=fmt.get('filesize'),
            filesize_approx=fmt.get('filesize_approx'),
            format_note=fmt.get('format_note'),
            fps=fmt.get('fps'),
            vcodec=fmt.get('vcodec'),
            acodec=fmt.get('acodec'),
            format_type=self._get_format_type(fmt),
            tbr=fmt.get('tbr')
        )
    
    def _select_best_formats(self, formats: list) -> tuple[Optional[VideoFormat], Optional[VideoFormat]]:
        """
        Select the best video and audio formats for merging.
        
        Returns:
            Tuple of (best_video_format, best_audio_format)
        """
        video_formats = []
        audio_formats = []
        
        for fmt in formats:
            format_type = self._get_format_type(fmt)
            parsed = self._parse_format(fmt)
            
            if format_type == FormatType.VIDEO_ONLY:
                video_formats.append((fmt, parsed))
            elif format_type == FormatType.AUDIO_ONLY:
                audio_formats.append((fmt, parsed))
        
        # Sort video by resolution (height) and bitrate
        best_video = None
        if video_formats:
            video_formats.sort(
                key=lambda x: (
                    x[0].get('height', 0) or 0,
                    x[0].get('tbr', 0) or 0
                ),
                reverse=True
            )
            best_video = video_formats[0][1]
        
        # Sort audio by bitrate
        best_audio = None
        if audio_formats:
            audio_formats.sort(
                key=lambda x: x[0].get('abr', 0) or x[0].get('tbr', 0) or 0,
                reverse=True
            )
            best_audio = audio_formats[0][1]
        
        return best_video, best_audio
    
    async def fetch_video_info(self, url: str) -> VideoInfo:
        """
        Fetch video metadata without downloading.
        
        Args:
            url: Video URL to extract info from
            
        Returns:
            VideoInfo object with metadata and available formats
            
        Raises:
            ValueError: If URL is invalid or video not found
        """
        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'extract_flat': False,
            # Options to help bypass bot detection
            'extractor_args': {'youtube': {'player_client': ['web']}},
            'http_headers': {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
            },
        }
        
        loop = asyncio.get_event_loop()
        
        def extract():
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                return ydl.extract_info(url, download=False)
        
        try:
            info = await loop.run_in_executor(None, extract)
        except yt_dlp.utils.DownloadError as e:
            raise ValueError(f"Failed to extract video info: {str(e)}")
        except Exception as e:
            raise ValueError(f"An error occurred: {str(e)}")
        
        if not info:
            raise ValueError("Could not extract video information")
        
        # Parse all formats
        formats = []
        raw_formats = info.get('formats', [])
        for fmt in raw_formats:
            try:
                formats.append(self._parse_format(fmt))
            except Exception:
                continue  # Skip malformed formats
        
        # Select best formats
        best_video, best_audio = self._select_best_formats(raw_formats)
        
        return VideoInfo(
            id=info.get('id', ''),
            title=info.get('title', 'Unknown'),
            description=info.get('description'),
            duration=info.get('duration'),
            thumbnail=info.get('thumbnail'),
            uploader=info.get('uploader'),
            uploader_url=info.get('uploader_url'),
            view_count=info.get('view_count'),
            like_count=info.get('like_count'),
            upload_date=info.get('upload_date'),
            webpage_url=info.get('webpage_url', url),
            formats=formats,
            best_video_format=best_video,
            best_audio_format=best_audio
        )
    
    def _sanitize_filename(self, filename: str) -> str:
        """Remove or replace characters that are invalid in filenames"""
        # Remove invalid characters for Windows/Unix
        invalid_chars = r'[<>:"/\\|?*]'
        sanitized = re.sub(invalid_chars, '_', filename)
        # Remove leading/trailing spaces and dots
        sanitized = sanitized.strip(' .')
        # Limit length
        if len(sanitized) > 200:
            sanitized = sanitized[:200]
        return sanitized or 'video'
    
    async def download_best_quality(
        self, 
        url: str, 
        progress_callback: Optional[Callable[[DownloadProgress], None]] = None
    ) -> tuple[str, str]:
        """
        Download video in best quality (video + audio merged).
        
        Args:
            url: Video URL to download
            progress_callback: Optional callback for progress updates
            
        Returns:
            Tuple of (file_path, filename) for the downloaded file
            
        Raises:
            ValueError: If download fails
        """
        # Generate unique filename to avoid conflicts
        unique_id = str(uuid.uuid4())[:8]
        output_template = os.path.join(
            self.download_dir, 
            f'%(title)s_{unique_id}.%(ext)s'
        )
        
        progress_info = DownloadProgress(status="starting")
        
        def progress_hook(d: dict):
            nonlocal progress_info
            
            if d['status'] == 'downloading':
                progress_info = DownloadProgress(
                    status="downloading",
                    downloaded_bytes=d.get('downloaded_bytes'),
                    total_bytes=d.get('total_bytes') or d.get('total_bytes_estimate'),
                    speed=d.get('speed'),
                    eta=d.get('eta'),
                    filename=d.get('filename')
                )
                if progress_info.total_bytes and progress_info.downloaded_bytes:
                    progress_info.percentage = (
                        progress_info.downloaded_bytes / progress_info.total_bytes * 100
                    )
            elif d['status'] == 'finished':
                progress_info = DownloadProgress(
                    status="merging",
                    filename=d.get('filename'),
                    percentage=100.0
                )
            
            if progress_callback:
                progress_callback(progress_info)
        
        # Check if FFmpeg is available
        ffmpeg_available = self._check_ffmpeg()
        
        # Common options to help bypass bot detection
        common_opts = {
            'outtmpl': output_template,
            'progress_hooks': [progress_hook],
            'quiet': True,
            'no_warnings': True,
            'extractor_args': {'youtube': {'player_client': ['web']}},
            'http_headers': {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
            },
        }
        
        if ffmpeg_available:
            # Best quality: merge best video + best audio
            ydl_opts = {
                **common_opts,
                'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo+bestaudio/best',
                'merge_output_format': 'mp4',
                # FFmpeg post-processor for merging
                'postprocessors': [{
                    'key': 'FFmpegVideoConvertor',
                    'preferedformat': 'mp4',
                }],
            }
        else:
            # Fallback: download best single format that has both video+audio
            ydl_opts = {
                **common_opts,
                'format': 'best[ext=mp4]/best',
            }
        
        loop = asyncio.get_event_loop()
        
        def download():
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=True)
                # Get the actual output filename
                if info:
                    filename = ydl.prepare_filename(info)
                    # Handle potential extension change after merge
                    base, _ = os.path.splitext(filename)
                    for ext in ['.mp4', '.mkv', '.webm']:
                        potential_file = base + ext
                        if os.path.exists(potential_file):
                            return potential_file, info.get('title', 'video')
                    return filename, info.get('title', 'video')
                return None, None
        
        try:
            file_path, title = await loop.run_in_executor(None, download)
        except yt_dlp.utils.DownloadError as e:
            raise ValueError(f"Download failed: {str(e)}")
        except Exception as e:
            raise ValueError(f"An error occurred during download: {str(e)}")
        
        if not file_path or not os.path.exists(file_path):
            raise ValueError("Download completed but file not found")
        
        # Create a safe filename for the download
        safe_title = self._sanitize_filename(title)
        _, ext = os.path.splitext(file_path)
        download_filename = f"{safe_title}{ext}"
        
        if progress_callback:
            progress_callback(DownloadProgress(
                status="completed",
                filename=file_path,
                percentage=100.0
            ))
        
        return file_path, download_filename

    async def download_with_quality(
        self,
        url: str,
        download_type: DownloadType,
        quality: Optional[str] = None,
        progress_callback: Optional[Callable[[DownloadProgress], None]] = None
    ) -> tuple[str, str]:
        """
        Download video or audio with specified quality.
        
        Args:
            url: Video URL to download
            download_type: VIDEO or AUDIO
            quality: Quality ID (e.g., "1080p", "720p", "320kbps")
            progress_callback: Optional callback for progress updates
            
        Returns:
            Tuple of (file_path, filename) for the downloaded file
            
        Raises:
            ValueError: If download fails
        """
        unique_id = str(uuid.uuid4())[:8]
        output_template = os.path.join(
            self.download_dir,
            f'%(title)s_{unique_id}.%(ext)s'
        )
        
        progress_info = DownloadProgress(status="starting")
        
        def progress_hook(d: dict):
            nonlocal progress_info
            
            if d['status'] == 'downloading':
                progress_info = DownloadProgress(
                    status="downloading",
                    downloaded_bytes=d.get('downloaded_bytes'),
                    total_bytes=d.get('total_bytes') or d.get('total_bytes_estimate'),
                    speed=d.get('speed'),
                    eta=d.get('eta'),
                    filename=d.get('filename')
                )
                if progress_info.total_bytes and progress_info.downloaded_bytes:
                    progress_info.percentage = (
                        progress_info.downloaded_bytes / progress_info.total_bytes * 100
                    )
            elif d['status'] == 'finished':
                progress_info = DownloadProgress(
                    status="processing",
                    filename=d.get('filename'),
                    percentage=100.0
                )
            
            if progress_callback:
                progress_callback(progress_info)
        
        ffmpeg_available = self._check_ffmpeg()
        
        # Common options
        common_opts = {
            'outtmpl': output_template,
            'progress_hooks': [progress_hook],
            'quiet': True,
            'no_warnings': True,
            'extractor_args': {'youtube': {'player_client': ['web']}},
            'http_headers': {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
            },
        }
        
        if download_type == DownloadType.AUDIO:
            # Audio-only download
            ydl_opts = {
                **common_opts,
                'format': 'bestaudio/best',
                'postprocessors': [{
                    'key': 'FFmpegExtractAudio',
                    'preferredcodec': 'mp3',
                    'preferredquality': quality.replace('kbps', '') if quality else '192',
                }] if ffmpeg_available else [],
            }
        else:
            # Video download with quality selection
            if quality:
                # Extract height from quality string (e.g., "1080p" -> 1080)
                height = int(quality.replace('p', ''))
                if ffmpeg_available:
                    format_str = f'bestvideo[height<={height}][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<={height}]+bestaudio/best[height<={height}]'
                else:
                    format_str = f'best[height<={height}][ext=mp4]/best[height<={height}]'
            else:
                # Best quality (default)
                if ffmpeg_available:
                    format_str = 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo+bestaudio/best'
                else:
                    format_str = 'best[ext=mp4]/best'
            
            ydl_opts = {
                **common_opts,
                'format': format_str,
                'merge_output_format': 'mp4' if ffmpeg_available else None,
            }
            
            if ffmpeg_available:
                ydl_opts['postprocessors'] = [{
                    'key': 'FFmpegVideoConvertor',
                    'preferedformat': 'mp4',
                }]
        
        loop = asyncio.get_event_loop()
        
        def download():
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=True)
                if info:
                    filename = ydl.prepare_filename(info)
                    base, _ = os.path.splitext(filename)
                    
                    # Check for different extensions based on download type
                    if download_type == DownloadType.AUDIO:
                        extensions = ['.mp3', '.m4a', '.webm', '.opus']
                    else:
                        extensions = ['.mp4', '.mkv', '.webm']
                    
                    for ext in extensions:
                        potential_file = base + ext
                        if os.path.exists(potential_file):
                            return potential_file, info.get('title', 'video')
                    
                    # Check if original file exists
                    if os.path.exists(filename):
                        return filename, info.get('title', 'video')
                    
                return None, None
        
        try:
            file_path, title = await loop.run_in_executor(None, download)
        except yt_dlp.utils.DownloadError as e:
            raise ValueError(f"Download failed: {str(e)}")
        except Exception as e:
            raise ValueError(f"An error occurred during download: {str(e)}")
        
        if not file_path or not os.path.exists(file_path):
            raise ValueError("Download completed but file not found")
        
        safe_title = self._sanitize_filename(title or 'video')
        _, ext = os.path.splitext(file_path)
        download_filename = f"{safe_title}{ext}"
        
        if progress_callback:
            progress_callback(DownloadProgress(
                status="completed",
                filename=file_path,
                percentage=100.0
            ))
        
        return file_path, download_filename


# Singleton instance for the service
_service_instance: Optional[YTDLPService] = None


def get_ytdlp_service(download_dir: Optional[str] = None) -> YTDLPService:
    """Get or create the YT-DLP service instance"""
    global _service_instance
    if _service_instance is None:
        _service_instance = YTDLPService(download_dir)
    return _service_instance
