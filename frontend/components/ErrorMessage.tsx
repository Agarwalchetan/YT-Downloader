'use client';

import { AlertTriangle, X } from 'lucide-react';

interface ErrorMessageProps {
  message: string;
  onDismiss?: () => void;
}

export default function ErrorMessage({ message, onDismiss }: ErrorMessageProps) {
  const clean = message
    .replace(/\x1B\[[0-9;]*m/g, '')
    .replace(/\[0;31m|\[0m/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return (
    <div className="mt-4 flex items-start gap-3 px-4 py-3.5
                    rounded-xl bg-red-950/40 border border-red-800/30">
      <div className="flex-shrink-0 mt-0.5 p-1 rounded-lg bg-red-900/50">
        <AlertTriangle size={13} className="text-red-400" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-0.5">
          Error
        </p>
        <p className="text-sm text-red-300/90 leading-relaxed break-words">
          {clean}
        </p>
      </div>

      {onDismiss && (
        <button
          onClick={onDismiss}
          aria-label="Dismiss"
          className="flex-shrink-0 mt-0.5 text-red-600/60 hover:text-red-400 transition-colors"
        >
          <X size={15} />
        </button>
      )}
    </div>
  );
}
