'use client';

import { useEffect, useState } from 'react';
import { Server, Cpu, Zap, RefreshCw, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { getServerStatus, ServerStatus } from '@/lib/api';

export default function ServerStatusBar() {
  const [status, setStatus]           = useState<ServerStatus | null>(null);
  const [loading, setLoading]         = useState(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const check = async () => {
    setLoading(true);
    try {
      setStatus(await getServerStatus());
      setLastChecked(new Date());
    } catch {
      setStatus({ backend: false, ffmpeg: false, ytdlp: false, ytdlp_version: null });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    check();
    const id = setInterval(check, 30_000);
    return () => clearInterval(id);
  }, []);

  const allGood = status?.backend && status?.ffmpeg && status?.ytdlp;
  const partial = status?.backend && (!status?.ffmpeg || !status?.ytdlp);
  const offline = !status || !status.backend;

  const borderCls = offline
    ? 'border-red-500/20 bg-red-500/[0.04]'
    : partial
    ? 'border-amber-500/20 bg-amber-500/[0.04]'
    : 'border-emerald-500/20 bg-emerald-500/[0.04]';

  const dotCls = offline
    ? 'bg-red-500'
    : partial
    ? 'bg-amber-500'
    : 'bg-emerald-500';

  const labelCls = offline
    ? 'text-red-400'
    : partial
    ? 'text-amber-400'
    : 'text-emerald-400';

  const labelText = offline
    ? 'Offline'
    : partial
    ? 'Degraded'
    : 'All Systems Operational';

  return (
    <div className={`glass rounded-2xl border ${borderCls} px-4 py-3`}>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* Overall */}
        <div className="flex items-center gap-2">
          <span className={`inline-block w-2 h-2 rounded-full pulse-dot ${dotCls}`} />
          <span className={`text-xs font-semibold tracking-widest uppercase ${labelCls}`}>
            {labelText}
          </span>
        </div>

        {/* Per-service */}
        {status && (
          <div className="flex items-center gap-4 flex-wrap">
            <StatusPill label="Backend" ok={status.backend} icon={<Server size={11} />} />
            <StatusPill label="FFmpeg"  ok={status.ffmpeg}  icon={<Cpu size={11} />}
              detail={status.ffmpeg ? undefined : 'limited'} />
            <StatusPill label="yt-dlp" ok={status.ytdlp}   icon={<Zap size={11} />}
              detail={status.ytdlp_version ?? undefined} />
          </div>
        )}

        {/* Time + refresh */}
        <div className="flex items-center gap-2 ml-auto">
          {lastChecked && (
            <span className="text-[10px] text-zinc-600 tabular-nums hidden sm:block">
              {lastChecked.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button
            onClick={check}
            disabled={loading}
            title="Refresh"
            className="p-1.5 rounded-lg text-zinc-600 hover:text-zinc-300
                       hover:bg-white/5 transition-all disabled:opacity-40"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* FFmpeg warning */}
      {status?.backend && !status.ffmpeg && (
        <div className="mt-2.5 flex items-center gap-2 text-amber-400/80 text-xs">
          <AlertTriangle size={11} />
          <span>FFmpeg not found — install it for HD video + audio merging</span>
        </div>
      )}
    </div>
  );
}

function StatusPill({
  label, ok, icon, detail,
}: {
  label: string; ok: boolean; icon: React.ReactNode; detail?: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={ok ? 'text-emerald-400' : 'text-red-400'}>{icon}</span>
      <span className="text-xs text-zinc-400">{label}</span>
      {ok
        ? <CheckCircle2 size={10} className="text-emerald-500" />
        : <XCircle      size={10} className="text-red-500" />}
      {detail && (
        <span className="text-[10px] text-zinc-600 hidden md:inline">({detail})</span>
      )}
    </div>
  );
}
