'use client';

import { VideoInfo as VideoInfoType } from '@/lib/api';
import { Clock, Eye, User, Calendar, MonitorPlay, Volume2 } from 'lucide-react';
import Image from 'next/image';

interface VideoInfoProps {
  info: VideoInfoType;
}

function formatNumber(num: number | null): string {
  if (num === null) return 'N/A';
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'N/A';
  // Format: YYYYMMDD -> YYYY-MM-DD
  if (dateStr.length === 8) {
    const year = dateStr.slice(0, 4);
    const month = dateStr.slice(4, 6);
    const day = dateStr.slice(6, 8);
    return `${year}-${month}-${day}`;
  }
  return dateStr;
}

export default function VideoInfo({ info }: VideoInfoProps) {
  return (
    <div className="bg-gray-700/30 rounded-xl p-4 md:p-6 border border-gray-600/50">
      <div className="flex flex-col md:flex-row gap-4 md:gap-6">
        {/* Thumbnail */}
        {info.thumbnail && (
          <div className="flex-shrink-0 mx-auto md:mx-0">
            <div className="relative w-48 h-28 md:w-56 md:h-32 rounded-lg overflow-hidden bg-gray-800">
              <Image
                src={info.thumbnail}
                alt={info.title}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h3 className="text-lg font-semibold text-white mb-3 line-clamp-2">
            {info.title}
          </h3>

          {/* Meta Info Grid */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {/* Duration */}
            <div className="flex items-center gap-2 text-gray-400">
              <Clock size={14} className="flex-shrink-0" />
              <span>{info.duration_formatted}</span>
            </div>

            {/* Views */}
            <div className="flex items-center gap-2 text-gray-400">
              <Eye size={14} className="flex-shrink-0" />
              <span>{formatNumber(info.view_count)} views</span>
            </div>

            {/* Uploader */}
            {info.uploader && (
              <div className="flex items-center gap-2 text-gray-400">
                <User size={14} className="flex-shrink-0" />
                <span className="truncate">{info.uploader}</span>
              </div>
            )}

            {/* Upload Date */}
            {info.upload_date && (
              <div className="flex items-center gap-2 text-gray-400">
                <Calendar size={14} className="flex-shrink-0" />
                <span>{formatDate(info.upload_date)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quality Info */}
      <div className="mt-4 pt-4 border-t border-gray-600/50">
        <p className="text-xs text-gray-500 mb-2">Download Quality</p>
        <div className="flex flex-wrap gap-3">
          {/* Video Quality */}
          {info.best_video && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-900/30 border border-green-700/50 rounded-lg">
              <MonitorPlay size={14} className="text-green-400" />
              <span className="text-green-300 text-sm font-medium">
                {info.best_video.resolution}
                {info.best_video.fps && ` @ ${info.best_video.fps}fps`}
              </span>
            </div>
          )}

          {/* Audio Quality */}
          {info.best_audio && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-900/30 border border-blue-700/50 rounded-lg">
              <Volume2 size={14} className="text-blue-400" />
              <span className="text-blue-300 text-sm font-medium">
                {info.best_audio.format_note || 'Best Audio'}
              </span>
            </div>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Video and audio will be merged automatically
        </p>
      </div>
    </div>
  );
}
