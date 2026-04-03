'use client';

import React, { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Track } from '@/types';
import { usePlayerStore } from '@/stores';
import { truncateText } from '@/lib/utils';
import { Play, Pause, X, ExternalLink, MessageCircle, Star } from 'lucide-react';
const CommentsModal = dynamic(() => import('@/components/ui').then((m) => m.CommentsModal), { ssr: false });
import { useFavoritesStore } from '@/stores';



interface PlaylistItemProps {
  track: Track;
  index: number;
  isActive: boolean;
  onPlay: () => void;
  onRemove: () => void;
  showThumbnail?: boolean;
}

function PlaylistItemComponent({
  track,
  index,
  isActive,
  onPlay,
  onRemove,
  showThumbnail = false,
}: PlaylistItemProps) {
  const [showComments, setShowComments] = useState(false);

  const handleRedditClick = useCallback(() => {
    if (track.redditUrl) {
      window.open(track.redditUrl, '_blank');
    }
  }, [track.redditUrl]);

  const handleCommentsClick = useCallback(() => {
    setShowComments(true);
  }, []);

  function FavoriteButton({ track }: { track: Track }) {
    const addFavorite = useFavoritesStore((s) => s.addFavorite);
    const removeFavorite = useFavoritesStore((s) => s.removeFavorite);
    const isFav = useFavoritesStore((s) => s.isFavorite(track.youtubeId));

    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (isFav) removeFavorite(track.youtubeId);
          else addFavorite(track);
        }}
        className={`p-0.5 hover:text-yellow-400 ${isFav ? 'text-yellow-400' : 'text-terminal-muted'}`}
        title={isFav ? 'Remove from favorites' : 'Add to favorites'}
      >
        <Star className="w-3 h-3" fill={isFav ? "currentColor" : "none"} />
      </button>
    );
  }

  return (
    <div
      className={`group flex items-center gap-1.5 p-1.5 font-mono text-[11px] border-b border-terminal-border/50 hover:bg-terminal-hover ${
        isActive ? 'bg-terminal-accent/10' : ''
      }`}
    >
      {showThumbnail && track.youtubeId && (
        <img
          src={`https://img.youtube.com/vi/${track.youtubeId}/mqdefault.jpg`}
          alt="thumb"
          className="w-6 h-4 object-cover rounded shrink-0"
        />
      )}
      {/* Index / Play button */}
      <button onClick={onPlay} className="w-6 h-6 flex items-center justify-center shrink-0">
        {isActive ? (
          <span className="text-terminal-accent">♪</span>
        ) : (
          <>
            <span className="group-hover:hidden text-terminal-muted">
              {String(index + 1).padStart(2, '0')}
            </span>
            <Play className="w-3 h-3 hidden group-hover:block" />
          </>
        )}
      </button>

      {/* Track info */}
      <div className="flex-1 min-w-0 cursor-pointer" onClick={onPlay}>
        <div className={`truncate ${isActive ? 'text-terminal-accent' : 'text-terminal-text'}`}>
          {truncateText(track.title, 40)}
        </div>
        {track.artist && (
          <div className="text-terminal-muted truncate text-[10px]">{track.artist}</div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
        {track.redditUrl && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRedditClick();
              }}
              className="p-0.5 hover:text-terminal-accent"
              title="Open Reddit thread"
            >
              <ExternalLink className="w-3 h-3" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCommentsClick();
              }}
              className="p-0.5 hover:text-terminal-accent"
              title="View comments"
            >
              <MessageCircle className="w-3 h-3" />
            </button>
          </>
        )}

        {/* Favorite toggle */}
        <FavoriteButton track={track} />

        {/* Remove */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="p-0.5 hover:text-red-400"
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      {/* Comments Modal */}
      <CommentsModal
        permalink={track.redditUrl || ''}
        title={track.title}
        isOpen={showComments}
        onClose={() => setShowComments(false)}
      />
    </div>
  );
}

export const PlaylistItem = React.memo(PlaylistItemComponent, (prev, next) => {
  // Only rerender when identity or active state changes; ignore handler identity
  return prev.track.id === next.track.id && prev.isActive === next.isActive && prev.index === next.index;
});
