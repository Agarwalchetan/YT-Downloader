'use client';

import { Video, Music } from 'lucide-react';
import { QualityOption, DownloadType } from '@/lib/api';

interface QualitySelectorProps {
  downloadType: DownloadType;
  onDownloadTypeChange: (type: DownloadType) => void;
  videoQualities: QualityOption[];
  audioQualities: QualityOption[];
  selectedQuality: string | null;
  onQualityChange: (quality: string) => void;
  disabled?: boolean;
}

export default function QualitySelector({
  downloadType,
  onDownloadTypeChange,
  videoQualities,
  audioQualities,
  selectedQuality,
  onQualityChange,
  disabled = false,
}: QualitySelectorProps) {
  const qualities = downloadType === 'video' ? videoQualities : audioQualities;

  return (
    <div className="space-y-4">
      {/* Download Type Toggle */}
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={() => onDownloadTypeChange('video')}
          disabled={disabled}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
            ${downloadType === 'video'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        >
          <Video size={18} />
          <span>Video</span>
        </button>
        <button
          onClick={() => onDownloadTypeChange('audio')}
          disabled={disabled}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
            ${downloadType === 'audio'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        >
          <Music size={18} />
          <span>Audio Only</span>
        </button>
      </div>

      {/* Quality Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">
          Select Quality
        </label>
        <select
          value={selectedQuality || ''}
          onChange={(e) => onQualityChange(e.target.value)}
          disabled={disabled || qualities.length === 0}
          className="
            w-full px-4 py-3 rounded-lg
            bg-gray-700 border border-gray-600
            text-white text-sm
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
            disabled:opacity-50 disabled:cursor-not-allowed
            appearance-none cursor-pointer
          "
          style={{
            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
            backgroundPosition: 'right 0.75rem center',
            backgroundRepeat: 'no-repeat',
            backgroundSize: '1.5em 1.5em',
          }}
        >
          <option value="">
            {downloadType === 'video' ? 'Best Quality (Auto)' : 'Best Quality (Auto)'}
          </option>
          {qualities.map((q) => (
            <option key={q.quality_id} value={q.quality_id}>
              {q.label}
            </option>
          ))}
        </select>
      </div>

      {/* Quality Info */}
      <p className="text-xs text-gray-500 text-center">
        {downloadType === 'video'
          ? 'Video will be downloaded with best available audio merged'
          : 'Audio will be extracted and converted to MP3'}
      </p>
    </div>
  );
}
