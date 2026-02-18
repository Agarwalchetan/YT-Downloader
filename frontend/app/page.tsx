'use client';

import { useState } from 'react';
import UrlInput from '@/components/UrlInput';
import VideoInfo from '@/components/VideoInfo';
import DownloadButton from '@/components/DownloadButton';
import ErrorMessage from '@/components/ErrorMessage';
import QualitySelector from '@/components/QualitySelector';
import ServerStatusBar from '@/components/ServerStatusBar';
import GitHubStats from '@/components/GitHubStats';
import {
  fetchVideoInfo,
  downloadVideo,
  VideoInfo as VideoInfoType,
  DownloadType,
  QualityOption,
} from '@/lib/api';
import { Download } from 'lucide-react';

type Status = 'idle' | 'fetching' | 'ready' | 'downloading' | 'error';

export default function Home() {
  const [url, setUrl]                         = useState('');
  const [videoInfo, setVideoInfo]             = useState<VideoInfoType | null>(null);
  const [status, setStatus]                   = useState<Status>('idle');
  const [error, setError]                     = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadType, setDownloadType]       = useState<DownloadType>('video');
  const [selectedQuality, setSelectedQuality] = useState<string | null>(null);

  const handleFetchInfo = async () => {
    if (!url.trim()) { setError('Please enter a video URL'); return; }
    setError(null); setVideoInfo(null); setStatus('fetching'); setSelectedQuality(null);
    try {
      const info = await fetchVideoInfo(url);
      setVideoInfo(info); setStatus('ready');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch video info');
      setStatus('error');
    }
  };

  const handleDownload = async () => {
    if (!url.trim()) return;
    setError(null); setStatus('downloading'); setDownloadProgress(0);
    try {
      await downloadVideo(url, downloadType, selectedQuality || undefined, (p) => setDownloadProgress(p));
      setStatus('ready'); setDownloadProgress(100);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed');
      setStatus('error');
    }
  };

  const handleClear = () => {
    setUrl(''); setVideoInfo(null); setStatus('idle');
    setError(null); setDownloadProgress(0);
    setSelectedQuality(null); setDownloadType('video');
  };

  const handleDownloadTypeChange = (type: DownloadType) => {
    setDownloadType(type); setSelectedQuality(null);
  };

  const showContent = videoInfo !== null;

  return (
    <main className="bg-app min-h-screen">
      <div className="container mx-auto px-4 py-14 max-w-2xl">

        {/* ── Header ──────────────────────────────────────────── */}
        <header className="text-center mb-10">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl
                          bg-cyan-700/20 border border-cyan-700/30 mb-5">
            <Download size={26} className="text-cyan-400" />
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3">
            <span className="gradient-text">YT-Downloader</span>
          </h1>

          {/* Tagline */}
          <p className="text-zinc-400 text-base max-w-sm mx-auto mb-5">
            Download any video in maximum quality, fast.
          </p>

          {/* GitHub stats */}
          <GitHubStats />
        </header>

        {/* ── Server status ────────────────────────────────────── */}
        <div className="mb-6">
          <ServerStatusBar />
        </div>

        {/* ── Main card ────────────────────────────────────────── */}
        <div className="glass-elevated rounded-3xl p-6 md:p-8 space-y-6">

          {/* URL input — always visible */}
          <UrlInput
            value={url}
            onChange={setUrl}
            onSubmit={handleFetchInfo}
            onClear={handleClear}
            isLoading={status === 'fetching'}
            disabled={status === 'downloading'}
          />

          {/* Error */}
          {error && (
            <ErrorMessage message={error} onDismiss={() => setError(null)} />
          )}

          {/* Video info */}
          {showContent && (
            <div className="animate-enter">
              <VideoInfo info={videoInfo!} />
            </div>
          )}

          {/* Quality selector */}
          {showContent && (
            <div className="animate-enter delay-100">
              <div className="divider mb-6" />
              <QualitySelector
                downloadType={downloadType}
                onDownloadTypeChange={handleDownloadTypeChange}
                videoQualities={videoInfo!.video_qualities || []}
                audioQualities={videoInfo!.audio_qualities || []}
                selectedQuality={selectedQuality}
                onQualityChange={setSelectedQuality}
                disabled={status === 'downloading'}
              />
            </div>
          )}

          {/* Download button */}
          {showContent && (
            <div className="animate-enter delay-200">
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

        {/* ── Footer ───────────────────────────────────────────── */}
        <footer className="mt-10 text-center space-y-1.5">
          <p className="text-zinc-500 text-sm">
            Developed by{' '}
            <a
              href="https://github.com/Agarwalchetan"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-500 hover:text-cyan-300 font-medium transition-colors"
            >
              Chetan Agarwal
            </a>
            {' · '}
            <a
              href="https://github.com/Agarwalchetan/YT-Downloader"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-500 hover:text-cyan-300 transition-colors"
            >
              Source on GitHub
            </a>
          </p>
          <p className="text-zinc-700 text-xs">
            For educational purposes only. Respect content creators and platform terms of service.
          </p>
        </footer>

      </div>
    </main>
  );
}
