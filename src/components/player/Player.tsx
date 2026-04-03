'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import YouTube, { YouTubeEvent, YouTubePlayer } from 'react-youtube';
import { usePlayerStore, usePlaylistStore, useFavoritesStore } from '@/stores';
import { setBackgroundAudio } from '@/lib/backgroundAudio';
import { backgroundAudioManager } from '@/lib/backgroundAudioManager';
import { Capacitor } from '@capacitor/core';
import { GENRES } from '@/constants/genres';
import { PLAY_ICON } from '@/constants/ascii';
import { YOUTUBE_PLAYER_OPTIONS, PLAYER_STATES, YOUTUBE_ERROR_CODES } from '@/lib/youtube';
import { TerminalWindow } from '@/components/terminal';
import { Loading } from '@/components/ui';
import { ExternalLink, MessageCircle, Star } from 'lucide-react';

const CommentsModal = dynamic(() => import('@/components/ui').then((m) => m.CommentsModal), { ssr: false });

function PlayerComponent({ compact = false }: { compact?: boolean }) {
  const { currentTrack, isLoading, setIsLoading, repeatMode, isPlaying, setIsPlaying } = usePlayerStore();
  const { nextTrack, generatePlaylist, activePlaylist } = usePlaylistStore();
  const toggleFavorite = useFavoritesStore((state) => state.toggleFavorite);
  const isFavorite = useFavoritesStore(
    (state) => !!currentTrack && state.favorites.some((t) => t.youtubeId === currentTrack.youtubeId)
  );
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

    async function onVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        if (isPlaying && currentTrack && Capacitor.isNativePlatform()) {
          // Try to start native background audio on Android
          try {
            const position = playerRef.current?.getCurrentTime?.() || 0;
            const success = await backgroundAudioManager.startBackgroundAudio(
              currentTrack.youtubeId,
              position * 1000 // Convert seconds to ms
            );
            if (success) {
              console.log('[Player] Native background audio started');
              // Don't use bgResume if native player is active
              return;
            }
          } catch (error) {
            console.warn('[Player] Failed to start native background audio:', error);
          }
        }
        
        if (isPlaying) startBgResume();
      } else {
        stopBgResume();
        
        // Stop native background audio when app comes to foreground
        if (backgroundAudioManager.isInBackgroundAudioMode()) {
          try {
            const bgPosition = await backgroundAudioManager.getBackgroundAudioPosition();
            await backgroundAudioManager.stopBackgroundAudio();
            
            // Resume YouTube player at the position we were at in native player
            if (playerRef.current && currentTrack) {
              playerRef.current.loadVideoById(currentTrack.youtubeId);
              playerRef.current.seekTo(bgPosition / 1000); // Convert ms to seconds
              if (isPlaying) {
                playerRef.current.playVideo();
              }
            }
          } catch (error) {
            console.warn('[Player] Error switching from native player:', error);
          }
        } else if (isPlaying && playerRef.current) {
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
  }, [isPlaying, currentTrack]);

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

  // Start / stop the Android background audio service when playback state changes.
  useEffect(() => {
    setBackgroundAudio(isPlaying);
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
              <div className="mt-1 flex gap-1">
                {currentTrack?.redditUrl && (
                  <>
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
                  </>
                )}
                {currentTrack && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(currentTrack);
                    }}
                    className="p-0.5 text-terminal-muted hover:text-terminal-accent"
                    title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <Star className={`w-3 h-3 ${isFavorite ? 'text-yellow-300' : 'text-terminal-muted'}`} fill={isFavorite ? 'currentColor' : 'none'} />
                  </button>
                )}
              </div>
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
          currentTrack ? (
            <>
              {currentTrack.redditUrl && (
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
              )}
              <button
                onClick={() => currentTrack && toggleFavorite(currentTrack)}
                className="text-terminal-muted hover:text-terminal-accent p-0.5"
                title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Star className={`w-4 h-4 ${isFavorite ? 'text-yellow-300' : 'text-terminal-muted'}`} fill={isFavorite ? 'currentColor' : 'none'} />
              </button>
            </>
          ) : null
        }
      >
        <div className="player-container">
          {currentTrack ? (
            <>
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
                <div className="font-mono text-terminal-muted text-3xl mb-2">{PLAY_ICON}</div>
                <p className="font-mono text-xs text-terminal-muted">
                  Pick a genre below or
                </p>
                <p className="font-mono text-[10px] text-terminal-muted">
                  <button
                    onClick={handleRandomGenre}
                    disabled={isLoading}
                    className="text-terminal-accent font-mono text-[10px] border border-terminal-border px-2 py-1 rounded hover:border-terminal-accent disabled:opacity-50"
                  >
                    🎲 play a random genre
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
