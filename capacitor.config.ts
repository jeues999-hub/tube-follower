import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tubefollower.app',
  appName: 'TUBE FOLLOWER',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
