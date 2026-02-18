'use client';

import { useEffect, useState } from 'react';
import { Star, GitFork, Eye, Github, ExternalLink } from 'lucide-react';

interface GitHubStats {
  stars: number;
  forks: number;
  watchers: number;
}

const REPO_OWNER = 'Agarwalchetan';
const REPO_NAME  = 'YT-Downloader';
const REPO_URL   = `https://github.com/${REPO_OWNER}/${REPO_NAME}`;
const AUTHOR_URL = `https://github.com/${REPO_OWNER}`;

function fmt(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return String(n);
}

export default function GitHubStats() {
  const [stats, setStats] = useState<GitHubStats | null>(null);

  useEffect(() => {
    fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`)
      .then(r => r.json())
      .then(data => {
        if (data.stargazers_count !== undefined) {
          setStats({
            stars:    data.stargazers_count,
            forks:    data.forks_count,
            watchers: data.subscribers_count ?? data.watchers_count ?? 0,
          });
        }
      })
      .catch(() => {/* silently ignore */});
  }, []);

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {/* Repo link */}
      <a
        href={REPO_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full
                   bg-zinc-800 border border-zinc-700 hover:border-cyan-700/60
                   hover:bg-cyan-900/20 text-zinc-400 hover:text-cyan-300
                   text-xs font-medium transition-all duration-200 group"
      >
        <Github size={13} className="group-hover:text-cyan-400 transition-colors" />
        <span>{REPO_OWNER}/{REPO_NAME}</span>
        <ExternalLink size={10} className="opacity-40" />
      </a>

      {/* Stats — only shown when loaded */}
      {stats && (
        <>
          <a
            href={`${REPO_URL}/stargazers`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full
                       bg-zinc-800 border border-zinc-700 hover:border-amber-500/40
                       hover:bg-amber-900/20 text-zinc-400 hover:text-amber-300
                       text-xs font-medium transition-all duration-200"
          >
            <Star size={12} className="text-amber-400" />
            <span>{fmt(stats.stars)}</span>
          </a>

          <a
            href={`${REPO_URL}/forks`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full
                       bg-zinc-800 border border-zinc-700 hover:border-cyan-700/40
                       hover:bg-cyan-900/20 text-zinc-400 hover:text-cyan-300
                       text-xs font-medium transition-all duration-200"
          >
            <GitFork size={12} className="text-cyan-500" />
            <span>{fmt(stats.forks)}</span>
          </a>

          <a
            href={`${REPO_URL}/watchers`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full
                       bg-zinc-800 border border-zinc-700 hover:border-emerald-500/40
                       hover:bg-emerald-900/20 text-zinc-400 hover:text-emerald-300
                       text-xs font-medium transition-all duration-200"
          >
            <Eye size={12} className="text-emerald-400" />
            <span>{fmt(stats.watchers)}</span>
          </a>
        </>
      )}

      {/* Author badge */}
      <a
        href={AUTHOR_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full
                   bg-cyan-900/25 border border-cyan-700/35 hover:border-cyan-500/60
                   hover:bg-cyan-900/40 text-cyan-400 hover:text-cyan-200
                   text-xs font-semibold transition-all duration-200"
      >
        <Github size={12} />
        <span>@Agarwalchetan</span>
      </a>
    </div>
  );
}
