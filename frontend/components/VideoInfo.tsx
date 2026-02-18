'use client';

import Image from 'next/image';
import { VideoInfo as VideoInfoType } from '@/lib/api';
import { Clock, Eye, User, Calendar, MonitorPlay, Volume2, ExternalLink } from 'lucide-react';

interface VideoInfoProps {
  info: VideoInfoType;
}

function fmt(n: number | null): string {
  if (n === null) return '—';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString();
}

function fmtDate(s: string | null): string {
  if (!s) return '—';
  if (s.length === 8) return `${s.slice(0,4)}-${s.slice(4,6)}-${s.slice(6,8)}`;
  return s;
}

export default function VideoInfo({ info }: VideoInfoProps) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
      {/* Thumbnail + title */}
      <div className="flex">
        {info.thumbnail && (
          <div className="relative w-36 md:w-48 flex-shrink-0">
            <div className="relative w-full aspect-video">
              <Image
                src={info.thumbnail}
                alt={info.title}
                fill
                className="object-cover"
                unoptimized
              />
              {/* Fade into card bg */}
              <div className="absolute inset-y-0 right-0 w-10
                              bg-gradient-to-r from-transparent to-zinc-900/90" />
            </div>
          </div>
        )}

        <div className="flex-1 min-w-0 px-4 py-4">
          <h3 className="text-sm md:text-[0.95rem] font-semibold text-zinc-100
                         line-clamp-2 leading-snug mb-3">
            {info.title}
          </h3>

          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            <MetaItem icon={<Clock    size={12} />} label={info.duration_formatted} />
            <MetaItem icon={<Eye      size={12} />} label={`${fmt(info.view_count)} views`} />
            {info.uploader    && <MetaItem icon={<User     size={12} />} label={info.uploader}          truncate />}
            {info.upload_date && <MetaItem icon={<Calendar size={12} />} label={fmtDate(info.upload_date)} />}
          </div>

          {info.webpage_url && (
            <a
              href={info.webpage_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-[11px]
                         text-cyan-600 hover:text-cyan-400 transition-colors"
            >
              <ExternalLink size={11} />
              Open original
            </a>
          )}
        </div>
      </div>

      {/* Quality badges */}
      <div className="divider" />
      <div className="px-4 py-3 flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600 mr-1">
          Best Available
        </span>

        {info.best_video && (
          <span className="badge bg-cyan-900/30 border border-cyan-700/35 text-cyan-300">
            <MonitorPlay size={11} className="text-cyan-400" />
            {info.best_video.resolution}
            {info.best_video.fps ? ` · ${info.best_video.fps}fps` : ''}
          </span>
        )}

        {info.best_audio && (
          <span className="badge bg-emerald-900/25 border border-emerald-700/30 text-emerald-300">
            <Volume2 size={11} className="text-emerald-400" />
            {info.best_audio.format_note || 'Best Audio'}
          </span>
        )}

        <span className="ml-auto text-[10px] text-zinc-600">
          Auto-merged with FFmpeg
        </span>
      </div>
    </div>
  );
}

function MetaItem({
  icon, label, truncate = false,
}: {
  icon: React.ReactNode; label: string; truncate?: boolean;
}) {
  return (
    <div className={`flex items-center gap-1.5 text-xs text-zinc-500 ${truncate ? 'min-w-0' : ''}`}>
      <span className="flex-shrink-0 text-zinc-600">{icon}</span>
      <span className={truncate ? 'truncate' : ''}>{label}</span>
    </div>
  );
}
