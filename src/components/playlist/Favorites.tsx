'use client';

import { useEffect, useRef, useState } from 'react';
import { useFavoritesStore } from '@/stores';
import { usePlaylistStore } from '@/stores/playlistStore';
import { usePlayerStore } from '@/stores/playerStore';
import { TerminalWindow } from '@/components/terminal';
import { PlaylistItem } from './PlaylistItem';
import { ListMusic, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

export function Favorites() {
  const { favorites, removeFavorite, clearFavorites } = useFavoritesStore();
  const { addTrackToQueue, setQueueIndex } = usePlaylistStore();
  const { setIsPlaying } = usePlayerStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(0);

  const TRACKS_PER_PAGE = 5;
  const totalPages = Math.ceil(favorites.length / TRACKS_PER_PAGE);
  const startIndex = currentPage * TRACKS_PER_PAGE;
  const visibleTracks = favorites.slice(startIndex, startIndex + TRACKS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(0);
  }, [favorites.length]);

  const handlePlayTrack = (trackIndex: number) => {
    const track = favorites[trackIndex];
    if (!track) return;
    addTrackToQueue(track);
    // Set queue index to last appended track (read current queue length after add)
    const qLen = usePlaylistStore.getState().queue.length;
    setQueueIndex(qLen - 1);
    setIsPlaying(true);
  };

  return (
    <TerminalWindow
      suppressHydrationWarning
      ref={containerRef}
      tabIndex={0}
      title={`[FAVORITES] ${favorites.length} tracks`}
      className="h-full flex flex-col"
      headerActions={
        favorites.length > 0 && (
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => clearFavorites()}
              className="p-0.5 text-terminal-muted hover:text-red-400"
              title="Clear favorites"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )
      }
    >
      <div className="flex-1 overflow-y-auto">
        {favorites.length === 0 ? (
          <div className="p-4 text-center">
            <ListMusic
              suppressHydrationWarning
              className="w-8 h-8 mx-auto mb-2 text-terminal-muted"
            />
            <p className="font-mono text-xs text-terminal-muted">No favorites yet</p>
          </div>
        ) : (
          <div>
            {visibleTracks.map((track, i) => {
              const globalIndex = startIndex + i;
              return (
                <div key={track.id}>
                  <PlaylistItem
                    track={track}
                    index={globalIndex}
                    isActive={false}
                    onPlay={() => handlePlayTrack(globalIndex)}
                    onRemove={() => removeFavorite(track.youtubeId)}
                    showThumbnail
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="border-t border-terminal-border p-1.5 flex items-center justify-between">
          <button
            onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            className="p-0.5 text-terminal-muted hover:text-terminal-accent disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-mono text-[10px] text-terminal-muted">
            {currentPage + 1}/{totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={currentPage === totalPages - 1}
            className="p-0.5 text-terminal-muted hover:text-terminal-accent disabled:opacity-50"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </TerminalWindow>
  );
}
