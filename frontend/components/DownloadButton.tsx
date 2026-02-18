'use client';

import { Download, Loader2, CheckCheck, Music, ArrowDown } from 'lucide-react';
import { DownloadType } from '@/lib/api';

interface DownloadButtonProps {
  onClick: () => void;
  isLoading?: boolean;
  progress?: number;
  disabled?: boolean;
  downloadType?: DownloadType;
}

export default function DownloadButton({
  onClick,
  isLoading = false,
  progress = 0,
  disabled = false,
  downloadType = 'video',
}: DownloadButtonProps) {
  const done    = progress >= 100 && !isLoading;
  const isAudio = downloadType === 'audio';

  const statusText = isAudio
    ? progress < 100 ? 'Downloading & extracting audio…' : 'Finalizing MP3…'
    : progress < 100 ? 'Downloading & merging video + audio…' : 'Finalizing…';

  return (
    <div className="space-y-3">
      <button
        onClick={onClick}
        disabled={isLoading || disabled}
        className={`
          w-full py-4 px-6 rounded-2xl font-bold text-base
          flex items-center justify-center gap-3
          transition-all duration-300
          focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/60
          disabled:opacity-40 disabled:cursor-not-allowed
          ${done
            ? 'bg-emerald-900/30 border border-emerald-600/30 text-emerald-300'
            : isLoading
            ? 'btn-download cursor-wait'
            : 'btn-download'}
        `}
      >
        {isLoading ? (
          <>
            <Loader2 size={20} className="animate-spin flex-shrink-0" />
            <span>
              {progress > 0 ? `Downloading… ${progress}%` : 'Starting download…'}
            </span>
          </>
        ) : done ? (
          <>
            <CheckCheck size={20} />
            <span>Download Complete!</span>
          </>
        ) : (
          <>
            {isAudio
              ? <Music    size={20} className="flex-shrink-0" />
              : <Download size={20} className="flex-shrink-0" />}
            <span>Download {isAudio ? 'Audio (MP3)' : 'Video'}</span>
            <ArrowDown size={16} className="flex-shrink-0 opacity-50" />
          </>
        )}
      </button>

      {/* Progress bar */}
      {isLoading && (
        <div className="relative w-full h-1.5 rounded-full overflow-hidden progress-track">
          {progress > 0 ? (
            <div
              className="absolute inset-y-0 left-0 rounded-full progress-fill
                         transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          ) : (
            <div className="absolute inset-0 progress-shimmer opacity-70" />
          )}
        </div>
      )}

      {/* Status text */}
      {isLoading && (
        <p className="text-center text-xs text-zinc-500">{statusText}</p>
      )}
    </div>
  );
}
