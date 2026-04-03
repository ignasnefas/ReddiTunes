'use client';

import { useHistoryStore } from '@/stores';
import { usePlaylistStore } from '@/stores/playlistStore';
import { usePlayerStore } from '@/stores/playerStore';
import { useFavoritesStore } from '@/stores';
import { TerminalWindow } from '@/components/terminal';
import { Play, Trash2, Star } from 'lucide-react';
import { getTimeAgo } from '@/lib/utils';

import React, { useRef, useEffect, useState } from 'react';
import { FixedSizeList as VirtualList } from 'react-window';

export function PlaylistHistory() {
  const { entries, removeEntry, clear } = useHistoryStore();
  const { addTrackToQueue, setQueueIndex } = usePlaylistStore();
  const { setIsPlaying } = usePlayerStore();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [listHeight, setListHeight] = useState(200);

  const updateListHeight = () => {
    if (containerRef.current) {
      const newHeight = containerRef.current.clientHeight;
      setListHeight(Math.max(newHeight, 100));
    }
  };

  useEffect(() => {
    updateListHeight();
    const ro = new ResizeObserver(updateListHeight);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  if (entries.length === 0) return null;

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const entry = entries[index];
    const { addFavorite, removeFavorite, isFavorite } = useFavoritesStore();

    return (
      <div style={style} key={entry.id} className="p-1">
        <div
          className="flex items-center gap-1.5 p-1.5 border border-terminal-border hover:border-terminal-accent group"
        >
          <img src={`https://img.youtube.com/vi/${entry.track.youtubeId}/mqdefault.jpg`} alt="thumb" className="w-6 h-4 object-cover rounded" />
          <div className="flex-1 min-w-0">
            <div className="font-mono text-[11px] text-terminal-text truncate">{entry.track.title}</div>
            <div className="font-mono text-[10px] text-terminal-muted">
            {entry.track.artist || (entry.track.redditUrl ? 'reddit' : 'YouTube')}
            {entry.track.genre ? ` • ${entry.track.genre}` : ''}
            {' • '}{getTimeAgo(entry.playedAt)}
          </div>
          </div>
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100">
            <button
              onClick={() => {
                addTrackToQueue(entry.track);
                // set queue index to last appended
                const qlen = usePlaylistStore.getState().queue.length;
                setQueueIndex(qlen - 1);
                setIsPlaying(true);
              }}
              className="p-1 hover:text-terminal-accent"
            >
              <Play className="w-3 h-3" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (isFavorite(entry.track.youtubeId)) {
                  removeFavorite(entry.track.youtubeId);
                } else {
                  addFavorite(entry.track);
                }
              }}
              className={`p-1 hover:text-yellow-400 ${isFavorite(entry.track.youtubeId) ? 'text-yellow-400' : 'text-terminal-muted'}`}
            >
              <Star className="w-3 h-3" fill={isFavorite(entry.track.youtubeId) ? "currentColor" : "none"} />
            </button>
            <button
              onClick={() => removeEntry(entry.id)}
              className="p-1 hover:text-red-400"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <TerminalWindow title="[HISTORY]" className="h-full" headerActions={
      entries.length > 0 && (
        <div className="flex items-center gap-0.5">
          <button onClick={() => clear()} className="p-0.5 text-terminal-muted hover:text-red-400" title="Clear history">
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      )
    }>
      <div ref={containerRef} className="h-full p-2 space-y-1 overflow-hidden">
        <VirtualList
          className="h-full"
          height={Math.max(listHeight, 100)}
          itemCount={entries.length}
          itemSize={56}
          width="100%"
        >
          {Row}
        </VirtualList>
      </div>
    </TerminalWindow>
  );
}
