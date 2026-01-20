'use client';

import { useEffect, useState } from 'react';
import { Server, Clapperboard, Music2, RefreshCw } from 'lucide-react';
import { getServerStatus, ServerStatus } from '@/lib/api';

interface StatusIndicatorProps {
  label: string;
  isOnline: boolean;
  icon: React.ReactNode;
  detail?: string;
}

function StatusIndicator({ label, isOnline, icon, detail }: StatusIndicatorProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="text-gray-400">{icon}</div>
      <span className="text-sm text-gray-300">{label}</span>
      <div className="flex items-center gap-1">
        <div
          className={`w-2 h-2 rounded-full ${
            isOnline ? 'bg-green-500' : 'bg-red-500'
          }`}
        />
        <span className={`text-xs ${isOnline ? 'text-green-400' : 'text-red-400'}`}>
          {isOnline ? 'Online' : 'Offline'}
        </span>
      </div>
      {detail && (
        <span className="text-xs text-gray-500">({detail})</span>
      )}
    </div>
  );
}

export default function ServerStatusBar() {
  const [status, setStatus] = useState<ServerStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkStatus = async () => {
    setIsLoading(true);
    try {
      const serverStatus = await getServerStatus();
      setStatus(serverStatus);
      setLastChecked(new Date());
    } catch {
      setStatus({
        backend: false,
        ffmpeg: false,
        ytdlp: false,
        ytdlp_version: null,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
    
    // Check status every 30 seconds
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const allOnline = status?.backend && status?.ffmpeg && status?.ytdlp;

  return (
    <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-300 flex items-center gap-2">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              allOnline ? 'bg-green-500' : status?.backend ? 'bg-yellow-500' : 'bg-red-500'
            }`}
          />
          Server Status
        </h3>
        <button
          onClick={checkStatus}
          disabled={isLoading}
          className="text-gray-400 hover:text-gray-300 transition-colors disabled:opacity-50"
          title="Refresh status"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {isLoading && !status ? (
        <div className="text-sm text-gray-400">Checking status...</div>
      ) : (
        <div className="space-y-2">
          <StatusIndicator
            label="Backend"
            isOnline={status?.backend ?? false}
            icon={<Server size={14} />}
          />
          <StatusIndicator
            label="FFmpeg"
            isOnline={status?.ffmpeg ?? false}
            icon={<Clapperboard size={14} />}
            detail={status?.ffmpeg ? 'Video merging enabled' : 'Limited quality'}
          />
          <StatusIndicator
            label="yt-dlp"
            isOnline={status?.ytdlp ?? false}
            icon={<Music2 size={14} />}
            detail={status?.ytdlp_version || undefined}
          />
        </div>
      )}

      {lastChecked && (
        <p className="text-xs text-gray-600 mt-3">
          Last checked: {lastChecked.toLocaleTimeString()}
        </p>
      )}

      {!status?.ffmpeg && status?.backend && (
        <p className="text-xs text-yellow-500/80 mt-2">
          FFmpeg not found. Install FFmpeg for best quality downloads.
        </p>
      )}
    </div>
  );
}
