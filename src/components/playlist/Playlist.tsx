'use client';

import React, { useEffect, useRef, useState } from 'react';
import { usePlaylistStore, usePlayerStore } from '@/stores';
import { TerminalWindow } from '@/components/terminal';
import { PlaylistItem } from './PlaylistItem';
import { Button, Loading } from '@/components/ui';
import { ListMusic, Trash2, RefreshCw } from 'lucide-react';
import { FixedSizeList as VirtualList } from 'react-window';



export function Playlist() {
  const {
    queue,
    queueIndex,
    activePlaylist,
    isLoading,
    setQueueIndex,
    removeTrackFromQueue,
    clearQueue,
    refreshPlaylist,
    loadMoreTracks,
    isShuffled,
  } = usePlaylistStore();

  const { setCurrentTrack, currentTrack, setIsPlaying } = usePlayerStore();
  const activeItemRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Show full queue (no paging)
  const visibleTracks = queue; // All queued tracks

  // Sync current track with queue index - single source of truth
  useEffect(() => {
    const track = queue[queueIndex];
    if (track && track.id !== currentTrack?.id) {
      setCurrentTrack(track);
    }
  }, [queueIndex, queue, currentTrack?.id, setCurrentTrack]);



  const handlePlayTrack = (index: number) => {
    // Set queue index and request playback
    setQueueIndex(index);
    setIsPlaying(true);
  }; 

  return (
    <TerminalWindow
      ref={containerRef}
      tabIndex={0}
      title={`${queue.length} tracks${isShuffled ? ' [S]' : ''}`}
      className="h-full flex flex-col"
      headerActions={
        <div className="flex items-center gap-0.5">
          {queue.length > 0 && (
            <>
              <button
                onClick={() => activePlaylist && refreshPlaylist(activePlaylist.id)}
                disabled={isLoading || !activePlaylist}
                className="p-0.5 text-terminal-muted hover:text-terminal-accent disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={clearQueue}
                className="p-0.5 text-terminal-muted hover:text-red-400"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </>
          )}

          {activePlaylist && (
            <Button size="sm" onClick={() => loadMoreTracks(20)} disabled={isLoading} className="ml-1">
              Load more
            </Button>
          )}
        </div>
      }
    >
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 flex justify-center">
            <Loading text="Loading" />
          </div>
        ) : queue.length === 0 ? (
          <div className="p-4 text-center">
            <ListMusic className="w-8 h-8 mx-auto mb-2 text-terminal-muted" />
            <p className="font-mono text-xs text-terminal-muted">No tracks</p>
          </div>
        ) : (
          <div>
            {/* Virtualized list for performance */}
            <div ref={containerRef} className="w-full">
              <VirtualizedPlaylist />
            </div>
          </div>
        )}

      </div>


    </TerminalWindow>
  );

  function VirtualizedPlaylist() {
    const [listHeight, setListHeight] = useState(400);
    const listRef = useRef<any>(null);

    useEffect(() => {
      // Measure available height using ResizeObserver
      const ro = new ResizeObserver(() => {
        setListHeight(containerRef.current?.clientHeight || 400);
      });
      if (containerRef.current) ro.observe(containerRef.current);
      // Initial measurement
      setListHeight(containerRef.current?.clientHeight || 400);
      return () => ro.disconnect();
    }, []);

    useEffect(() => {
      if (typeof queueIndex === 'number' && listRef.current) {
        try {
          listRef.current.scrollToItem(queueIndex, 'center');
        } catch (e) {}
      }
    }, [queueIndex]);

    const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
      const track = visibleTracks[index];
      const isActiveRow = index === queueIndex;
      return (
        <div style={style} key={track.id} ref={isActiveRow ? activeItemRef : undefined}>
          <PlaylistItem
            track={track}
            index={index}
            isActive={isActiveRow}
            onPlay={() => handlePlayTrack(index)}
            onRemove={() => removeTrackFromQueue(track.id)}
            showThumbnail
          />
        </div>
      );
    };

    return (
      <VirtualList
        height={listHeight}
        itemCount={visibleTracks.length}
        itemSize={44}
        width="100%"
        ref={listRef}
      >
        {Row}
      </VirtualList>
    );
  }
}

