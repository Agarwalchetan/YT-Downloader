/**
 * API client for communicating with the YT-Downloader backend
 */

import axios, { AxiosError } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 300000, // 5 minutes for large downloads
});

export type DownloadType = 'video' | 'audio';

export interface QualityOption {
  quality_id: string;
  label: string;
  resolution?: string;
  height?: number;
  bitrate?: number;
}

export interface VideoInfo {
  id: string;
  title: string;
  description: string | null;
  duration: number | null;
  duration_formatted: string;
  thumbnail: string | null;
  uploader: string | null;
  view_count: number | null;
  upload_date: string | null;
  webpage_url: string;
  best_video: {
    resolution: string;
    format_note: string | null;
    fps: number | null;
  } | null;
  best_audio: {
    format_note: string | null;
  } | null;
  video_qualities: QualityOption[];
  audio_qualities: QualityOption[];
}

export interface ServerStatus {
  backend: boolean;
  ffmpeg: boolean;
  ytdlp: boolean;
  ytdlp_version: string | null;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string | null;
  data: T | null;
  error: string | null;
}

export interface ApiError {
  detail: string;
}

/**
 * Get server status including all dependencies
 */
export async function getServerStatus(): Promise<ServerStatus> {
  try {
    const response = await api.get<ServerStatus>('/api/status');
    return response.data;
  } catch {
    return {
      backend: false,
      ffmpeg: false,
      ytdlp: false,
      ytdlp_version: null,
    };
  }
}

/**
 * Fetch video metadata without downloading
 */
export async function fetchVideoInfo(url: string): Promise<VideoInfo> {
  try {
    const response = await api.post<ApiResponse<VideoInfo>>('/api/info', { url });
    
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to fetch video info');
    }
    
    return response.data.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ApiError>;
      throw new Error(
        axiosError.response?.data?.detail || 
        axiosError.message || 
        'Failed to fetch video info'
      );
    }
    throw error;
  }
}

/**
 * Download video or audio with specified quality
 */
export async function downloadVideo(
  url: string,
  downloadType: DownloadType = 'video',
  quality?: string,
  onProgress?: (progress: number) => void
): Promise<void> {
  try {
    const response = await api.post('/api/download', {
      url,
      download_type: downloadType,
      quality,
    }, {
      responseType: 'blob',
      onDownloadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const progress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
          onProgress(progress);
        }
      },
    });

    // Extract filename from Content-Disposition header
    const contentDisposition = response.headers['content-disposition'];
    let filename = downloadType === 'audio' ? 'audio.mp3' : 'video.mp4';
    
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?([^";\n]+)"?/);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1];
      }
    }

    // Create blob URL and trigger download
    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Cleanup
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ApiError>;
      
      // Try to parse error from blob response
      if (axiosError.response?.data instanceof Blob) {
        const text = await axiosError.response.data.text();
        try {
          const errorData = JSON.parse(text);
          throw new Error(errorData.detail || 'Download failed');
        } catch {
          throw new Error('Download failed');
        }
      }
      
      throw new Error(
        axiosError.response?.data?.detail || 
        axiosError.message || 
        'Download failed'
      );
    }
    throw error;
  }
}

/**
 * Check API health
 */
export async function checkHealth(): Promise<boolean> {
  try {
    const response = await api.get('/api/health');
    return response.data?.status === 'healthy';
  } catch {
    return false;
  }
}

export default api;
