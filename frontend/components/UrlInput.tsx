'use client';

import { KeyboardEvent } from 'react';
import { Search, X, Loader2, Link2 } from 'lucide-react';

interface UrlInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onClear: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export default function UrlInput({
  value, onChange, onSubmit, onClear,
  isLoading = false, disabled = false,
}: UrlInputProps) {
  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isLoading && !disabled) onSubmit();
  };

  return (
    <div className="space-y-3">
      <label
        htmlFor="url-input"
        className="flex items-center gap-2 text-[11px] font-semibold
                   uppercase tracking-widest text-zinc-500"
      >
        <Link2 size={11} />
        Video URL
      </label>

      <div className="flex gap-2.5">
        {/* Input wrapper */}
        <div className="relative flex-1">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none">
            <Search size={16} />
          </div>

          <input
            id="url-input"
            type="url"
            value={value}
            onChange={e => onChange(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Paste YouTube, Vimeo or any video URL…"
            disabled={disabled || isLoading}
            className="input-field w-full rounded-xl py-3.5 pl-10 pr-10 text-sm
                       disabled:opacity-50 disabled:cursor-not-allowed"
          />

          {value && !isLoading && !disabled && (
            <button
              onClick={onClear}
              aria-label="Clear"
              className="absolute right-3 top-1/2 -translate-y-1/2
                         text-zinc-600 hover:text-zinc-300 transition-colors"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Fetch button */}
        <button
          onClick={onSubmit}
          disabled={isLoading || disabled || !value.trim()}
          className="btn-secondary flex items-center gap-2 px-5 py-3.5 rounded-xl
                     text-sm font-semibold whitespace-nowrap
                     disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              Fetching…
            </>
          ) : (
            <>
              <Search size={15} />
              Fetch Info
            </>
          )}
        </button>
      </div>

      <p className="text-[11px] text-zinc-600">
        Supports YouTube, Vimeo, Twitter/X, Instagram and 1000+ platforms via yt-dlp
      </p>
    </div>
  );
}
