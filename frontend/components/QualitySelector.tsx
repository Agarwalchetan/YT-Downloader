'use client';

import { Video, Music, ChevronDown } from 'lucide-react';
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
  downloadType, onDownloadTypeChange,
  videoQualities, audioQualities,
  selectedQuality, onQualityChange,
  disabled = false,
}: QualitySelectorProps) {
  const qualities = downloadType === 'video' ? videoQualities : audioQualities;

  return (
    <div className="space-y-4">
      {/* Type toggle */}
      <div className="flex p-1 gap-1 rounded-xl bg-zinc-900 border border-zinc-800">
        {(['video', 'audio'] as DownloadType[]).map(type => {
          const active = downloadType === type;
          return (
            <button
              key={type}
              onClick={() => onDownloadTypeChange(type)}
              disabled={disabled}
              className={`
                flex-1 flex items-center justify-center gap-2 py-2.5 px-4
                rounded-lg text-sm font-semibold transition-all duration-200
                disabled:opacity-40 disabled:cursor-not-allowed
                ${active
                  ? 'bg-cyan-700 text-white shadow-[0_2px_12px_rgba(6,182,212,0.30)]'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'}
              `}
            >
              {type === 'video'
                ? <Video size={15} className={active ? 'text-white' : 'text-zinc-600'} />
                : <Music size={15} className={active ? 'text-white' : 'text-zinc-600'} />}
              {type === 'video' ? 'Video' : 'Audio Only'}
            </button>
          );
        })}
      </div>

      {/* Quality dropdown */}
      <div>
        <label className="block text-[11px] font-semibold uppercase tracking-widest
                          text-zinc-600 mb-2">
          Quality
        </label>

        <div className="relative">
          <select
            value={selectedQuality || ''}
            onChange={e => onQualityChange(e.target.value)}
            disabled={disabled || qualities.length === 0}
            className="input-field w-full rounded-xl px-4 py-3.5 pr-10 text-sm
                       appearance-none cursor-pointer
                       disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <option value="">Best Quality (Auto)</option>
            {qualities.map(q => (
              <option key={q.quality_id} value={q.quality_id}>
                {q.label}
              </option>
            ))}
          </select>

          <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2
                          text-zinc-500">
            <ChevronDown size={16} />
          </div>
        </div>
      </div>

      {/* Hint */}
      <p className="text-[11px] text-zinc-600 text-center">
        {downloadType === 'video'
          ? 'Best available audio will be merged automatically'
          : 'Audio extracted and converted to MP3'}
      </p>
    </div>
  );
}
