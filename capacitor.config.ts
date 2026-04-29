import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.whatsmissing.app',
  appName: "What's Missing",
  webDir: 'dist',
  server: {
    url: 'https://whatsmissing.info',
    cleartext: false
  }
};

export default config;