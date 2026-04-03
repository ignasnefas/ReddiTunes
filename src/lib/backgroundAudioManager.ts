import { nativeAudioPlayer } from './nativeAudioPlayer';

interface AudioSessionState {
  isBackgroundAudio: boolean;
  currentVideoId: string | null;
  currentPosition: number;
  audioUrl: string | null;
}

class BackgroundAudioManager {
  private sessionState: AudioSessionState = {
    isBackgroundAudio: false,
    currentVideoId: null,
    currentPosition: 0,
    audioUrl: null,
  };

  private unsubscribeProgressTracker: (() => void) | null = null;

  async startBackgroundAudio(videoId: string, position: number = 0): Promise<boolean> {
    try {
      if (!videoId) {
        console.warn('[BackgroundAudio] No video ID provided');
        return false;
      }

      console.log(`[BackgroundAudio] Starting background audio for ${videoId} at ${position}ms`);

      // Fetch audio URL from our API
      const response = await fetch(`/api/youtube/audio?videoId=${videoId}`);
      if (!response.ok) {
        console.error('[BackgroundAudio] Failed to fetch audio URL:', response.status);
        return false;
      }

      const data = await response.json();
      const audioUrl = data.audioUrl;

      if (!audioUrl) {
        console.error('[BackgroundAudio] No audio URL returned');
        return false;
      }

      // Load audio into native player
      const loaded = await nativeAudioPlayer.loadAudio(audioUrl);
      if (!loaded) {
        console.error('[BackgroundAudio] Failed to load audio into native player');
        return false;
      }

      // Update session state
      this.sessionState = {
        isBackgroundAudio: true,
        currentVideoId: videoId,
        currentPosition: position,
        audioUrl,
      };

      // Seek to current position if needed
      if (position > 0) {
        await nativeAudioPlayer.seek(position / 1000); // Convert ms to seconds
      }

      // Start playback
      await nativeAudioPlayer.play();

      // Track progress and sync back to player
      this.startProgressTracking();

      console.log('[BackgroundAudio] Background audio started successfully');
      return true;
    } catch (error) {
      console.error('[BackgroundAudio] Error starting background audio:', error);
      return false;
    }
  }

  async stopBackgroundAudio(): Promise<void> {
    try {
      console.log('[BackgroundAudio] Stopping background audio');
      this.stopProgressTracking();
      await nativeAudioPlayer.stop();
      
      this.sessionState = {
        isBackgroundAudio: false,
        currentVideoId: null,
        currentPosition: 0,
        audioUrl: null,
      };
    } catch (error) {
      console.error('[BackgroundAudio] Error stopping background audio:', error);
    }
  }

  async pauseBackgroundAudio(): Promise<void> {
    try {
      await nativeAudioPlayer.pause();
      this.stopProgressTracking();
    } catch (error) {
      console.error('[BackgroundAudio] Error pausing background audio:', error);
    }
  }

  async resumeBackgroundAudio(): Promise<void> {
    try {
      await nativeAudioPlayer.play();
      this.startProgressTracking();
    } catch (error) {
      console.error('[BackgroundAudio] Error resuming background audio:', error);
    }
  }

  async getBackgroundAudioPosition(): Promise<number> {
    try {
      if (this.sessionState.isBackgroundAudio) {
        const position = await nativeAudioPlayer.getCurrentPosition();
        return position * 1000; // Convert seconds to ms
      }
      return 0;
    } catch (error) {
      console.error('[BackgroundAudio] Error getting position:', error);
      return 0;
    }
  }

  isInBackgroundAudioMode(): boolean {
    return this.sessionState.isBackgroundAudio;
  }

  getVideoId(): string | null {
    return this.sessionState.currentVideoId;
  }

  private startProgressTracking(): void {
    this.stopProgressTracking();
    
    this.unsubscribeProgressTracker = nativeAudioPlayer.on('audioProgress', (data: any) => {
      // Update session state with latest position
      this.sessionState.currentPosition = data.position * 1000; // Convert to ms
      
      // Dispatch custom event for player component to listen to
      const event = new CustomEvent('backgroundAudioProgress', {
        detail: { position: this.sessionState.currentPosition },
      });
      window.dispatchEvent(event);
    });
  }

  private stopProgressTracking(): void {
    if (this.unsubscribeProgressTracker) {
      this.unsubscribeProgressTracker();
      this.unsubscribeProgressTracker = null;
    }
  }
}

export const backgroundAudioManager = new BackgroundAudioManager();
