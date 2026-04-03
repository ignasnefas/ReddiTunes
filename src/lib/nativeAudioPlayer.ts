import { Capacitor, registerPlugin } from '@capacitor/core';

export interface NativeAudioPlayerPlugin {
  loadAudio(options: { url: string }): Promise<{ success: boolean }>;
  play(): Promise<void>;
  pause(): Promise<void>;
  stop(): Promise<void>;
  seek(options: { position: number }): Promise<void>;
  setVolume(options: { volume: number }): Promise<void>;
  getDuration(): Promise<{ duration: number }>;
  getCurrentPosition(): Promise<{ position: number }>;
  release(): Promise<void>;
  addListener(eventType: string, listenerFunc: (event: any) => void): () => void;
}

class NativeAudioPlayerWeb implements NativeAudioPlayerPlugin {
  private audioElement: HTMLAudioElement | null = null;
  private listeners: Map<string, Function[]> = new Map();

  async loadAudio(options: { url: string }): Promise<{ success: boolean }> {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.src = '';
    }
    this.audioElement = new Audio(options.url);
    this.audioElement.addEventListener('play', () => this.emit('audioPlaying'));
    this.audioElement.addEventListener('pause', () => this.emit('audioPaused'));
    this.audioElement.addEventListener('ended', () => this.emit('audioEnded'));
    this.audioElement.addEventListener('error', () => this.emit('audioError'));
    this.audioElement.addEventListener('timeupdate', () => 
      this.emit('audioProgress', { position: this.audioElement?.currentTime || 0 })
    );
    return { success: true };
  }

  async play(): Promise<void> {
    this.audioElement?.play();
  }

  async pause(): Promise<void> {
    this.audioElement?.pause();
  }

  async stop(): Promise<void> {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
    }
  }

  async seek(options: { position: number }): Promise<void> {
    if (this.audioElement) {
      this.audioElement.currentTime = options.position;
    }
  }

  async setVolume(options: { volume: number }): Promise<void> {
    if (this.audioElement) {
      this.audioElement.volume = Math.min(1, Math.max(0, options.volume));
    }
  }

  async getDuration(): Promise<{ duration: number }> {
    return { duration: this.audioElement?.duration || 0 };
  }

  async getCurrentPosition(): Promise<{ position: number }> {
    return { position: this.audioElement?.currentTime || 0 };
  }

  async release(): Promise<void> {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.src = '';
      this.audioElement = null;
    }
  }

  private emit(eventType: string, data?: any) {
    const callbacks = this.listeners.get(eventType) || [];
    callbacks.forEach(cb => cb(data));
  }

  addListener(eventType: string, listenerFunc: (event: any) => void) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType)?.push(listenerFunc);
    
    return () => {
      const callbacks = this.listeners.get(eventType) || [];
      const index = callbacks.indexOf(listenerFunc);
      if (index >= 0) {
        callbacks.splice(index, 1);
      }
    };
  }
}

const NativeAudioPlayer = registerPlugin<NativeAudioPlayerPlugin>(
  'NativeAudioPlayer',
  {
    web: new NativeAudioPlayerWeb(),
  }
);

export class NativeAudioPlayerWrapper {
  private listeners: Map<string, Set<Function>> = new Map();

  async loadAudio(url: string): Promise<boolean> {
    try {
      const result = await NativeAudioPlayer.loadAudio({ url });
      this.emit('audioLoaded', { url });
      return result.success;
    } catch (error) {
      console.error('[NativeAudioPlayer] Load error:', error);
      this.emit('audioError', error);
      return false;
    }
  }

  async play(): Promise<void> {
    try {
      await NativeAudioPlayer.play();
      this.emit('audioPlaying');
    } catch (error) {
      console.error('[NativeAudioPlayer] Play error:', error);
      this.emit('audioError', error);
    }
  }

  async pause(): Promise<void> {
    try {
      await NativeAudioPlayer.pause();
      this.emit('audioPaused');
    } catch (error) {
      console.error('[NativeAudioPlayer] Pause error:', error);
      this.emit('audioError', error);
    }
  }

  async stop(): Promise<void> {
    try {
      await NativeAudioPlayer.stop();
      this.emit('audioStopped');
    } catch (error) {
      console.error('[NativeAudioPlayer] Stop error:', error);
      this.emit('audioError', error);
    }
  }

  async seek(position: number): Promise<void> {
    try {
      await NativeAudioPlayer.seek({ position });
      this.emit('audioSeeked', { position });
    } catch (error) {
      console.error('[NativeAudioPlayer] Seek error:', error);
      this.emit('audioError', error);
    }
  }

  async setVolume(volume: number): Promise<void> {
    try {
      await NativeAudioPlayer.setVolume({ volume });
    } catch (error) {
      console.error('[NativeAudioPlayer] Volume error:', error);
    }
  }

  async getDuration(): Promise<number> {
    try {
      const result = await NativeAudioPlayer.getDuration();
      return result.duration;
    } catch (error) {
      console.error('[NativeAudioPlayer] Duration error:', error);
      return 0;
    }
  }

  async getCurrentPosition(): Promise<number> {
    try {
      const result = await NativeAudioPlayer.getCurrentPosition();
      return result.position;
    } catch (error) {
      console.error('[NativeAudioPlayer] Position error:', error);
      return 0;
    }
  }

  async release(): Promise<void> {
    try {
      await NativeAudioPlayer.release();
    } catch (error) {
      console.error('[NativeAudioPlayer] Release error:', error);
    }
  }

  on(event: string, callback: Function): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Also register with native plugin for native events
    const nativeUnsubscribe = NativeAudioPlayer.addListener(event, (data) => {
      callback(data);
    });

    return () => {
      this.listeners.get(event)?.delete(callback);
      nativeUnsubscribe();
    };
  }

  private emit(event: string, data?: any) {
    const callbacks = this.listeners.get(event) || new Set();
    callbacks.forEach(cb => cb(data));
  }
}

export const nativeAudioPlayer = new NativeAudioPlayerWrapper();
