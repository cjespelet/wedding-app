import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tuempresa.wedding',
  appName: 'Wedding App',
  webDir: 'www',
  server: {
    // Avoid HTTPS -> HTTP mixed-content blocking when API is http://...
    androidScheme: 'http',
    hostname: 'localhost',
  },
  cordova: {
    preferences: {
      ScrollEnabled: 'false',
      BackupWebStorage: 'none',
      SplashMaintainAspectRatio: 'true',
      FadeSplashScreenDuration: '300',
      SplashShowOnlyFirstTime: 'false',
      SplashScreen: 'screen',
      SplashScreenDelay: '3000'
    }
  }
};

export default config;
