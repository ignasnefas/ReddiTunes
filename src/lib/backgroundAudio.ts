import { Capacitor } from '@capacitor/core';
import { Plugins } from '@capacitor/core';

const { BackgroundAudio } = Plugins as any;

export async function setBackgroundAudio(playing: boolean) {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  try {
    if (playing) {
      await BackgroundAudio.start();
    } else {
      await BackgroundAudio.stop();
    }
  } catch (error) {
    console.warn('[BackgroundAudio] mobile plugin error', error);
  }
}
