"""
YT-Downloader Backend - Main FastAPI Application

A video downloader API for educational purposes only.
This application allows downloading videos in maximum quality
by merging the best video and audio streams.

Usage:
    uvicorn main:app --reload --port 8000
"""

import os
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from controllers.download_controller import router as download_router
from utils.file_cleanup import get_cleanup_manager

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# Lifespan context manager for startup/shutdown events
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler for startup and shutdown events"""
    # Startup
    logger.info("Starting YT-Downloader API...")
    
    # Initialize cleanup manager and start periodic cleanup
    cleanup_manager = get_cleanup_manager()
    cleanup_manager.start_periodic_cleanup(interval_minutes=15)
    logger.info("Started periodic file cleanup")
    
    yield
    
    # Shutdown
    logger.info("Shutting down YT-Downloader API...")
    cleanup_manager.stop_periodic_cleanup()
    logger.info("Stopped periodic file cleanup")


# Create FastAPI application
app = FastAPI(
    title="YT-Downloader API",
    description="""
    A video downloader API for educational purposes.
    
    ## Features
    - Fetch video metadata (title, duration, thumbnail, etc.)
    - Download videos in maximum available quality
    - Automatic video + audio merging using FFmpeg
    
    ## Disclaimer
    This API is for educational and personal use only.
    Users are responsible for complying with platform terms of service.
    """,
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS for frontend integration
# In production, restrict origins to your frontend domain
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Next.js default dev port
        "http://127.0.0.1:3000",
        "http://localhost:3001",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# Include routers
app.include_router(download_router)


@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "name": "YT-Downloader API",
        "version": "1.0.0",
        "description": "Video downloader API for educational purposes",
        "endpoints": {
            "info": "POST /api/info - Get video metadata",
            "download": "POST /api/download - Download video in best quality",
            "health": "GET /api/health - Health check",
        },
        "docs": "/docs",
    }


if __name__ == "__main__":
    import uvicorn
    
    # Run the server
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    )
