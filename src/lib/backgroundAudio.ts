import { Capacitor } from '@capacitor/core';
import { backgroundAudioManager } from './backgroundAudioManager';

export async function setBackgroundAudio(playing: boolean) {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  try {
    // The background audio manager handles native playback
    // This function is for API compatibility
    console.log('[BackgroundAudio] setBackgroundAudio called with playing=' + playing);
    
    if (playing && backgroundAudioManager.isInBackgroundAudioMode()) {
      await backgroundAudioManager.resumeBackgroundAudio();
    } else if (!playing && backgroundAudioManager.isInBackgroundAudioMode()) {
      await backgroundAudioManager.pauseBackgroundAudio();
    }
  } catch (error) {
    console.warn('[BackgroundAudio] Error:', error);
  }
}
