import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.reddituunes.app',
  appName: 'ReddiTunes',
  webDir: 'out',
  android: {
    allowMixedContent: false,
    backgroundColor: '#0a0a0f',
    // Keep audio playing in background by not muting WebView audio
    mediaPlaybackRequiresUserGesture: false,
    playsinline: true,
  },
  server: {
    androidScheme: 'https',
    cleartext: false,
  },
};

export default config;
