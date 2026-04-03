import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.reddituunes.app',
  appName: 'ReddiTunes',
  webDir: 'out',
  android: {
    allowMixedContent: false,
    backgroundColor: '#0a0a0f',
  },
  server: {
    androidScheme: 'https',
    cleartext: false,
  },
};

export default config;
