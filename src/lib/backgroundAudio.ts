import { Capacitor } from '@capacitor/core';

let wakelock: any = null;

export async function setBackgroundAudio(playing: boolean) {
  if (!Capacitor.isNativePlatform()) {
    // On web, try to use WakeLock API if available
    if (playing) {
      requestWakeLock();
    } else {
      releaseWakeLock();
    }
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
      // Also try WakeLock on Android
      requestWakeLock();
    } else {
      console.log('[BackgroundAudio] Stopping background audio service');
      await backgroundAudio.stop();
      releaseWakeLock();
    }
  } catch (error) {
    console.warn('[BackgroundAudio] Error:', error);
  }
}

export async function updateTrackInfo(title: string, artist: string) {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  try {
    const backgroundAudio = (window as any)?.Capacitor?.Plugins?.BackgroundAudio;
    if (!backgroundAudio) {
      return;
    }

    console.log('[BackgroundAudio] Updating track info:', { title, artist });
    await backgroundAudio.updateTrack({ title, artist });
  } catch (error) {
    console.warn('[BackgroundAudio] Error updating track:', error);
  }
}

async function requestWakeLock() {
  if (wakelock !== null) return;
  
  try {
    if ('wakeLock' in navigator) {
      console.log('[WakeLock] Requesting wake lock');
      wakelock = await (navigator as any).wakeLock.request('screen');
      wakelock.addEventListener('release', () => {
        console.log('[WakeLock] Wake lock released');
        wakelock = null;
      });
    }
  } catch (err) {
    console.warn('[WakeLock] Failed to request wake lock:', err);
  }
}

function releaseWakeLock() {
  if (wakelock !== null) {
    try {
      console.log('[WakeLock] Releasing wake lock');
      wakelock.release();
      wakelock = null;
    } catch (err) {
      console.warn('[WakeLock] Error releasing wake lock:', err);
    }
  }
}
