import { Capacitor } from '@capacitor/core';

export async function setBackgroundAudio(playing: boolean) {
  if (!Capacitor.isNativePlatform()) {
    console.log('[BackgroundAudio] Not a native platform, skipping');
    return;
  }

  try {
    const backgroundAudio = (window as any)?.Capacitor?.Plugins?.BackgroundAudio;
    if (!backgroundAudio) {
      console.warn('[BackgroundAudio] Plugin not available yet');
      // Retry after a short delay
      setTimeout(() => {
        setBackgroundAudio(playing);
      }, 500);
      return;
    }

    if (playing) {
      console.log('[BackgroundAudio] Starting background audio service');
      await backgroundAudio.start();
    } else {
      console.log('[BackgroundAudio] Stopping background audio service');
      await backgroundAudio.stop();
    }
  } catch (error) {
    console.warn('[BackgroundAudio] Error:', error);
  }
}
