'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import YouTube, { YouTubeEvent, YouTubePlayer } from 'react-youtube';
import { usePlayerStore, usePlaylistStore } from '@/stores';
import { GENRES } from '@/constants/genres';
import { YOUTUBE_PLAYER_OPTIONS, PLAYER_STATES, YOUTUBE_ERROR_CODES } from '@/lib/youtube';
import { TerminalWindow } from '@/components/terminal';
import { Loading } from '@/components/ui';
import { ExternalLink, MessageCircle } from 'lucide-react';

const CommentsModal = dynamic(() => import('@/components/ui').then((m) => m.CommentsModal), { ssr: false });

function PlayerComponent({ compact = false }: { compact?: boolean }) {
  const { currentTrack, isLoading, setIsLoading, repeatMode, isPlaying, setIsPlaying } = usePlayerStore();
  const { nextTrack, generatePlaylist, activePlaylist } = usePlaylistStore();
  const playerRef = useRef<YouTubePlayer | null>(null);
  const currentTrackIdRef = useRef<string | null>(null);

  const genreLabel = activePlaylist?.genre
    ? GENRES.find((genre) => genre.id === activePlaylist.genre)?.name ?? activePlaylist.genre
    : null;

  const handleRandomGenre = useCallback(() => {
    if (!GENRES || GENRES.length === 0) return;
    const randomGenre = GENRES[Math.floor(Math.random() * GENRES.length)];
    generatePlaylist(randomGenre);
    setIsPlaying(true);
  }, [generatePlaylist, setIsPlaying]);
  const [showComments, setShowComments] = useState(false);

  const openCurrentTrackComments = useCallback(() => {
    if (currentTrack && currentTrack.redditUrl) {
      setShowComments(true);
    }
  }, [currentTrack]);

  // Track component lifecycle
  useEffect(() => {
    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {
          console.log('[Player] Error destroying player:', e);
        }
        playerRef.current = null;
      }
      currentTrackIdRef.current = null;
    };
  }, []); // Remove currentTrack?.id dependency to prevent unnecessary destruction
  const onReady = useCallback((event: YouTubeEvent) => {
    playerRef.current = event.target;
    currentTrackIdRef.current = currentTrack?.id || null;

    // Load the current video
    if (currentTrack) {
      try {
        playerRef.current.loadVideoById(currentTrack.youtubeId);
        if (isPlaying) {
          playerRef.current.playVideo();
        }
      } catch (e) {
        console.warn('[Player] load/play onReady failed', e);
      }
    }
  }, [currentTrack, isPlaying]);

  // When track changes, load the new video
  useEffect(() => {
    if (!currentTrack || !playerRef.current) return;
    
    // Only load if this is a different track than what's currently loaded
    if (currentTrack.id !== currentTrackIdRef.current) {
      try {
        playerRef.current.loadVideoById(currentTrack.youtubeId);
        currentTrackIdRef.current = currentTrack.id;
        if (isPlaying) {
          playerRef.current.playVideo();
        }
      } catch (e) {
        console.warn('[Player] load video failed', e);
      }
    }
  }, [currentTrack?.id, isPlaying]);

  // When track changes or user requested play, attempt to start playback
  useEffect(() => {
    if (!currentTrack || !playerRef.current) return;
    if (playerRef.current && isPlaying) {
      try {
        playerRef.current.playVideo();
      } catch (e) {
        console.warn('[Player] play on currentTrack change failed', e);
      }
    }
  }, [currentTrack?.id, isPlaying]);

  // Keep trying to resume playback while the page is backgrounded (some emulators/browsers pause audio)
  const bgResumeInterval = useRef<number | null>(null);
  useEffect(() => {
    function startBgResume() {
      if (bgResumeInterval.current != null) return;
      bgResumeInterval.current = window.setInterval(() => {
        if (playerRef.current && isPlaying) {
          try {
            playerRef.current.playVideo();
          } catch (e) {
            // Ignore - play can be blocked by browser policy
          }
        }
      }, 1000);
    }
    function stopBgResume() {
      if (bgResumeInterval.current != null) {
        clearInterval(bgResumeInterval.current);
        bgResumeInterval.current = null;
      }
    }

    function onVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        if (isPlaying) startBgResume();
      } else {
        stopBgResume();
        if (isPlaying && playerRef.current) {
          try {
            playerRef.current.playVideo();
          } catch (e) {
            console.warn('[Player] resume after visibilitychange failed', e);
          }
        }
      }
    }

    document.addEventListener('visibilitychange', onVisibilityChange);
    // If already hidden when mounted
    if (document.visibilityState === 'hidden' && isPlaying) {
      startBgResume();
    }

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      stopBgResume();
    };
  }, [isPlaying]);

  // Integrate Media Session (helps some platforms keep playback alive and provides controls)
  useEffect(() => {
    if ('mediaSession' in navigator) {
      try {
        // Update playback state
        (navigator as any).mediaSession.playbackState = isPlaying ? 'playing' : 'paused';

        // Set basic handlers
        (navigator as any).mediaSession.setActionHandler?.('play', () => {
          usePlayerStore.getState().setIsPlaying(true);
          try { playerRef.current?.playVideo(); } catch {}
        });
        (navigator as any).mediaSession.setActionHandler?.('pause', () => {
          usePlayerStore.getState().setIsPlaying(false);
          try { playerRef.current?.pauseVideo(); } catch {}
        });
      } catch (e) {
        // ignore if mediaSession not fully supported
      }
    }
  }, [isPlaying]);

  const onStateChange = useCallback((event: YouTubeEvent) => {
    const state = event.data;
    switch (state) {
      case PLAYER_STATES.ENDED:
        if (repeatMode === 'one') {
          event.target?.seekTo?.(0);
          event.target?.playVideo?.();
        } else {
          nextTrack();
        }
        break;
      case PLAYER_STATES.BUFFERING:
        // Don't set global loading for transient buffering to avoid layout shift
        break;
      case PLAYER_STATES.PLAYING:
        setIsLoading(false);
        // Log to played history when a track actually starts playing
        try {
          const current = usePlayerStore.getState().currentTrack;
          if (current) {
            const add = require('@/stores/historyStore').useHistoryStore.getState().addEntry;
            add(current);
          }
        } catch (e) {
          // ignore logging errors
        }
        break;
      case PLAYER_STATES.PAUSED:
        setIsLoading(false);
        // When visible, treat PAUSED as a user action and update app state so it doesn't auto-resume.
        if (!document.hidden) {
          try {
            setIsPlaying(false);
          } catch (e) {
            // no-op if setting state fails for any reason
          }
        }
        // If the page is hidden and playback is expected, the bgResumeInterval will handle resuming.
        break;
      case PLAYER_STATES.CUED:
        setIsLoading(false);
        break;
    }
  }, [repeatMode, nextTrack, setIsLoading]);

  const onError = useCallback((event: YouTubeEvent) => {
    const code = (event as any)?.data;
    const reason = code ? (YOUTUBE_ERROR_CODES[code] ?? 'UNKNOWN_ERROR') : 'NO_CODE';
    const trackId = currentTrackIdRef.current ?? currentTrack?.id ?? 'unknown';
    console.error('[Player] onError', { code, reason }, 'for track:', trackId);
    setIsLoading(false);
    setTimeout(() => {
      nextTrack();
    }, 1000);
  }, [setIsLoading, nextTrack]);

  if (compact) {
    // Compact mini player UI for footer / small screens
    return (
      <div className="flex items-center gap-2 p-1">
        {currentTrack ? (
          <>
            <div className="w-36 h-20 bg-black rounded overflow-hidden">
              <YouTube
                videoId={currentTrack.youtubeId}
                opts={{
                  ...YOUTUBE_PLAYER_OPTIONS,
                  width: 320,
                  height: 180,
                }}
                onReady={onReady}
                onStateChange={onStateChange}
                onError={onError}
                className="w-full h-full"
                iframeClassName="w-full h-full"
              />
            </div>
            <div className="min-w-0">
              <div className="font-mono text-[11px] text-terminal-text truncate w-36">{currentTrack.title}</div>
              <div className="font-mono text-[10px] text-terminal-muted truncate w-36">{currentTrack.artist || ''}</div>
              {currentTrack.redditUrl && (
                <div className="mt-1 flex gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(currentTrack.redditUrl, '_blank');
                    }}
                    className="p-0.5 text-terminal-muted hover:text-terminal-accent"
                    title="Open current track Reddit thread"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openCurrentTrackComments();
                    }}
                    className="p-0.5 text-terminal-muted hover:text-terminal-accent"
                    title="View comments for current track"
                  >
                    <MessageCircle className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="font-mono text-[10px] text-terminal-muted">No track</div>
        )}

        <CommentsModal
          permalink={currentTrack?.redditUrl || ''}
          title={currentTrack?.title || 'Current Track'}
          isOpen={showComments}
          onClose={() => setShowComments(false)}
        />
      </div>
    );
  }

  return (
    <>
      <TerminalWindow 
        title={
          currentTrack
            ? `♪ ${genreLabel ? `${genreLabel} · ` : ''}${currentTrack.title}`
            : '♪ NO TRACK'
        }
        className="h-full"
        headerActions={
          currentTrack?.redditUrl ? (
            <>
              <button
                onClick={() => window.open(currentTrack.redditUrl, '_blank')}
                className="text-terminal-muted hover:text-terminal-accent p-0.5"
                title="Open current track Reddit thread"
              >
                <ExternalLink className="w-4 h-4" />
              </button>
              <button
                onClick={openCurrentTrackComments}
                className="text-terminal-muted hover:text-terminal-accent p-0.5"
                title="View comments for current track"
              >
                <MessageCircle className="w-4 h-4" />
              </button>
            </>
          ) : null
        }
      >
        <div className="player-container">
          {currentTrack ? (
            <>
              {genreLabel && (
                <div className="absolute top-2 left-2 z-10 px-2 py-1 rounded bg-black/70 text-terminal-accent font-mono text-[10px] uppercase tracking-wider">
                  {genreLabel}
                </div>
              )}
              <div>
                <YouTube
                  videoId={currentTrack.youtubeId}
                  opts={YOUTUBE_PLAYER_OPTIONS}
                  onReady={onReady}
                  onStateChange={onStateChange}
                  onError={onError}
                  className="w-full h-full"
                  iframeClassName="w-full h-full"
                />
              </div>
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-terminal-bg-secondary">
              <div className="text-center space-y-2">
                <div className="font-mono text-terminal-muted text-3xl mb-2">▶</div>
                <p className="font-mono text-xs text-terminal-muted">
                  Select a genre to start
                </p>
                <p className="font-mono text-[10px] text-terminal-muted">
                  or play a{' '}
                  <button
                    onClick={handleRandomGenre}
                    disabled={isLoading}
                    className="text-terminal-accent font-mono text-[10px] border border-terminal-border px-2 py-1 rounded hover:border-terminal-accent disabled:opacity-50"
                  >
                    random genre
                  </button>
                </p>
              </div>
            </div>
          )}
      </div>
    </TerminalWindow>

      <CommentsModal
        permalink={currentTrack?.redditUrl || ''}
        title={currentTrack?.title || 'Current Track'}
        isOpen={showComments}
        onClose={() => setShowComments(false)}
      />
    </>
  );
}

export const Player = React.memo(PlayerComponent);
