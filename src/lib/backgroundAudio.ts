import { Capacitor } from '@capacitor/core';

export async function setBackgroundAudio(playing: boolean) {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  try {
    const backgroundAudio = (window as any)?.Capacitor?.Plugins?.BackgroundAudio;
    if (!backgroundAudio) {
      return;
    }

    if (playing) {
      await backgroundAudio.start();
    } else {
      await backgroundAudio.stop();
    }
  } catch (error) {
    console.warn('[BackgroundAudio] mobile plugin error', error);
  }
}
