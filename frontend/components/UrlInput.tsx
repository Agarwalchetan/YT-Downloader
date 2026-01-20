'use client';

import { useState, KeyboardEvent } from 'react';
import { Search, X, Loader2 } from 'lucide-react';

interface UrlInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onClear: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export default function UrlInput({
  value,
  onChange,
  onSubmit,
  onClear,
  isLoading = false,
  disabled = false,
}: UrlInputProps) {
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isLoading && !disabled) {
      onSubmit();
    }
  };

  return (
    <div className="space-y-4">
      <label htmlFor="url-input" className="block text-sm font-medium text-gray-300">
        Video URL
      </label>
      
      <div className="relative flex gap-3">
        {/* Input Field */}
        <div className="relative flex-1">
          <input
            id="url-input"
            type="url"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Paste video URL here..."
            disabled={disabled || isLoading}
            className="w-full px-4 py-3 pl-11 bg-gray-700/50 border border-gray-600 rounded-xl 
                     text-white placeholder-gray-400 
                     focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-all duration-200"
          />
          
          {/* Search Icon */}
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <Search size={20} />
          </div>
          
          {/* Clear Button */}
          {value && !isLoading && !disabled && (
            <button
              onClick={onClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 
                       hover:text-white transition-colors"
              aria-label="Clear input"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Submit Button */}
        <button
          onClick={onSubmit}
          disabled={isLoading || disabled || !value.trim()}
          className="px-6 py-3 bg-primary-600 hover:bg-primary-700 
                   text-white font-medium rounded-xl
                   focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 
                   focus:ring-offset-gray-800
                   disabled:opacity-50 disabled:cursor-not-allowed
                   transition-all duration-200 flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>Loading...</span>
            </>
          ) : (
            <>
              <Search size={18} />
              <span>Fetch</span>
            </>
          )}
        </button>
      </div>

      <p className="text-xs text-gray-500">
        Supports YouTube, Vimeo, and many other platforms
      </p>
    </div>
  );
}
