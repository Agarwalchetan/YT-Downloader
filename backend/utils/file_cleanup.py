"""
File Cleanup Utilities - Handles temporary file management and cleanup.
Ensures downloaded files are properly removed after streaming to client.
"""

import os
import asyncio
import logging
from typing import Optional
from pathlib import Path
from datetime import datetime, timedelta
import threading
import time

logger = logging.getLogger(__name__)


class FileCleanupManager:
    """Manages cleanup of temporary download files"""
    
    def __init__(self, download_dir: str, max_age_minutes: int = 30):
        """
        Initialize the cleanup manager.
        
        Args:
            download_dir: Directory where downloads are stored
            max_age_minutes: Maximum age of files before automatic cleanup
        """
        self.download_dir = download_dir
        self.max_age_minutes = max_age_minutes
        self._cleanup_thread: Optional[threading.Thread] = None
        self._stop_event = threading.Event()
    
    def delete_file(self, file_path: str) -> bool:
        """
        Safely delete a file.
        
        Args:
            file_path: Path to the file to delete
            
        Returns:
            True if file was deleted, False otherwise
        """
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                logger.info(f"Deleted file: {file_path}")
                return True
            return False
        except PermissionError:
            logger.warning(f"Permission denied when deleting: {file_path}")
            return False
        except Exception as e:
            logger.error(f"Error deleting file {file_path}: {e}")
            return False
    
    async def delete_file_async(self, file_path: str, delay_seconds: int = 0) -> bool:
        """
        Asynchronously delete a file with optional delay.
        
        Args:
            file_path: Path to the file to delete
            delay_seconds: Seconds to wait before deleting
            
        Returns:
            True if file was deleted, False otherwise
        """
        if delay_seconds > 0:
            await asyncio.sleep(delay_seconds)
        
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self.delete_file, file_path)
    
    def schedule_deletion(self, file_path: str, delay_seconds: int = 60):
        """
        Schedule a file for deletion after a delay.
        Useful for ensuring file is fully streamed before deletion.
        
        Args:
            file_path: Path to the file to delete
            delay_seconds: Seconds to wait before deleting
        """
        def delayed_delete():
            time.sleep(delay_seconds)
            self.delete_file(file_path)
        
        thread = threading.Thread(target=delayed_delete, daemon=True)
        thread.start()
        logger.info(f"Scheduled deletion of {file_path} in {delay_seconds} seconds")
    
    def cleanup_old_files(self) -> int:
        """
        Clean up files older than max_age_minutes.
        
        Returns:
            Number of files deleted
        """
        deleted_count = 0
        cutoff_time = datetime.now() - timedelta(minutes=self.max_age_minutes)
        
        try:
            for filename in os.listdir(self.download_dir):
                file_path = os.path.join(self.download_dir, filename)
                
                if not os.path.isfile(file_path):
                    continue
                
                # Check file modification time
                try:
                    mtime = datetime.fromtimestamp(os.path.getmtime(file_path))
                    if mtime < cutoff_time:
                        if self.delete_file(file_path):
                            deleted_count += 1
                except Exception as e:
                    logger.error(f"Error checking file age for {file_path}: {e}")
        except Exception as e:
            logger.error(f"Error during cleanup: {e}")
        
        if deleted_count > 0:
            logger.info(f"Cleaned up {deleted_count} old files")
        
        return deleted_count
    
    def start_periodic_cleanup(self, interval_minutes: int = 15):
        """
        Start a background thread that periodically cleans up old files.
        
        Args:
            interval_minutes: How often to run cleanup
        """
        if self._cleanup_thread and self._cleanup_thread.is_alive():
            return
        
        def cleanup_loop():
            while not self._stop_event.is_set():
                self.cleanup_old_files()
                # Wait for interval or until stop event
                self._stop_event.wait(timeout=interval_minutes * 60)
        
        self._stop_event.clear()
        self._cleanup_thread = threading.Thread(target=cleanup_loop, daemon=True)
        self._cleanup_thread.start()
        logger.info(f"Started periodic cleanup every {interval_minutes} minutes")
    
    def stop_periodic_cleanup(self):
        """Stop the periodic cleanup thread"""
        self._stop_event.set()
        if self._cleanup_thread:
            self._cleanup_thread.join(timeout=5)
            logger.info("Stopped periodic cleanup")


# Global cleanup manager instance
_cleanup_manager: Optional[FileCleanupManager] = None


def get_cleanup_manager(download_dir: Optional[str] = None) -> FileCleanupManager:
    """Get or create the cleanup manager instance"""
    global _cleanup_manager
    if _cleanup_manager is None:
        import tempfile
        download_dir = download_dir or tempfile.gettempdir()
        _cleanup_manager = FileCleanupManager(download_dir)
    return _cleanup_manager


def cleanup_file_after_response(file_path: str, delay_seconds: int = 5):
    """
    Helper function to cleanup a file after it has been sent in a response.
    
    Args:
        file_path: Path to the file to clean up
        delay_seconds: Delay before deletion (to ensure streaming completes)
    """
    manager = get_cleanup_manager()
    manager.schedule_deletion(file_path, delay_seconds)
