'use client';

import { Download, Loader2, Check, Music } from 'lucide-react';
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
  const isComplete = progress >= 100 && !isLoading;
  const isAudio = downloadType === 'audio';

  return (
    <div className="space-y-3">
      <button
        onClick={onClick}
        disabled={isLoading || disabled}
        className={`
          w-full py-4 px-6 rounded-xl font-semibold text-lg
          flex items-center justify-center gap-3
          transition-all duration-300
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800
          ${isComplete
            ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500 text-white'
            : isLoading
            ? 'bg-primary-600/80 text-white cursor-wait'
            : 'bg-primary-600 hover:bg-primary-700 focus:ring-primary-500 text-white'
          }
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
      >
        {isLoading ? (
          <>
            <Loader2 size={24} className="animate-spin" />
            <span>Downloading... {progress > 0 ? `${progress}%` : ''}</span>
          </>
        ) : isComplete ? (
          <>
            <Check size={24} />
            <span>Download Complete!</span>
          </>
        ) : (
          <>
            {isAudio ? <Music size={24} /> : <Download size={24} />}
            <span>Download {isAudio ? 'Audio' : 'Video'}</span>
          </>
        )}
      </button>

      {/* Progress Bar */}
      {isLoading && (
        <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
          <div
            className="bg-primary-500 h-full rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Status Text */}
      {isLoading && (
        <p className="text-center text-sm text-gray-400">
          {isAudio
            ? progress < 100
              ? 'Downloading and extracting audio...'
              : 'Finalizing audio...'
            : progress < 100
            ? 'Downloading and merging video + audio...'
            : 'Finalizing download...'}
        </p>
      )}
    </div>
  );
}
