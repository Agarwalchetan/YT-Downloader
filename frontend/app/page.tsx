'use client';

import { useState } from 'react';
import UrlInput from '@/components/UrlInput';
import VideoInfo from '@/components/VideoInfo';
import DownloadButton from '@/components/DownloadButton';
import ErrorMessage from '@/components/ErrorMessage';
import QualitySelector from '@/components/QualitySelector';
import ServerStatusBar from '@/components/ServerStatusBar';
import { 
  fetchVideoInfo, 
  downloadVideo, 
  VideoInfo as VideoInfoType,
  DownloadType,
  QualityOption
} from '@/lib/api';

type Status = 'idle' | 'fetching' | 'ready' | 'downloading' | 'error';

export default function Home() {
  const [url, setUrl] = useState('');
  const [videoInfo, setVideoInfo] = useState<VideoInfoType | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  
  // Quality selection state
  const [downloadType, setDownloadType] = useState<DownloadType>('video');
  const [selectedQuality, setSelectedQuality] = useState<string | null>(null);

  const handleFetchInfo = async () => {
    if (!url.trim()) {
      setError('Please enter a video URL');
      return;
    }

    setError(null);
    setVideoInfo(null);
    setStatus('fetching');
    setSelectedQuality(null);

    try {
      const info = await fetchVideoInfo(url);
      setVideoInfo(info);
      setStatus('ready');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch video info');
      setStatus('error');
    }
  };

  const handleDownload = async () => {
    if (!url.trim()) return;

    setError(null);
    setStatus('downloading');
    setDownloadProgress(0);

    try {
      await downloadVideo(
        url,
        downloadType,
        selectedQuality || undefined,
        (progress) => {
          setDownloadProgress(progress);
        }
      );
      setStatus('ready');
      setDownloadProgress(100);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed');
      setStatus('error');
    }
  };

  const handleClear = () => {
    setUrl('');
    setVideoInfo(null);
    setStatus('idle');
    setError(null);
    setDownloadProgress(0);
    setSelectedQuality(null);
    setDownloadType('video');
  };

  const handleDownloadTypeChange = (type: DownloadType) => {
    setDownloadType(type);
    setSelectedQuality(null); // Reset quality when switching type
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            YT-Downloader
          </h1>
          <p className="text-gray-400 text-lg">
            Download videos in your preferred quality
          </p>
          <p className="text-gray-500 text-sm mt-2">
            For educational purposes only
          </p>
        </div>

        {/* Server Status Bar */}
        <div className="mb-6">
          <ServerStatusBar />
        </div>

        {/* Main Card */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-2xl p-6 md:p-8 border border-gray-700">
          {/* URL Input */}
          <UrlInput
            value={url}
            onChange={setUrl}
            onSubmit={handleFetchInfo}
            onClear={handleClear}
            isLoading={status === 'fetching'}
            disabled={status === 'downloading'}
          />

          {/* Error Message */}
          {error && (
            <ErrorMessage 
              message={error} 
              onDismiss={() => setError(null)} 
            />
          )}

          {/* Video Info */}
          {videoInfo && (
            <div className="mt-6">
              <VideoInfo info={videoInfo} />
            </div>
          )}

          {/* Quality Selector */}
          {videoInfo && (
            <div className="mt-6">
              <QualitySelector
                downloadType={downloadType}
                onDownloadTypeChange={handleDownloadTypeChange}
                videoQualities={videoInfo.video_qualities || []}
                audioQualities={videoInfo.audio_qualities || []}
                selectedQuality={selectedQuality}
                onQualityChange={setSelectedQuality}
                disabled={status === 'downloading'}
              />
            </div>
          )}

          {/* Download Button */}
          {videoInfo && (
            <div className="mt-6">
              <DownloadButton
                onClick={handleDownload}
                isLoading={status === 'downloading'}
                progress={downloadProgress}
                disabled={status === 'fetching'}
                downloadType={downloadType}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-gray-500 text-sm">
          <p>
            This tool is for educational purposes only.
          </p>
          <p className="mt-1">
            Please respect content creators and platform terms of service.
          </p>
        </footer>
      </div>
    </main>
  );
}
