import type { ExpoConfig } from "expo/config";

// Optional HTTPS host for Universal/App Links (e.g. "meetingnotes.example.com").
// Leave unset to ship with custom-scheme deep links only.
const DEEP_LINK_HOST = process.env.EXPO_PUBLIC_DEEP_LINK_HOST?.trim();

const config: ExpoConfig = {
  name: "Meeting Notes",
  slug: "meeting-notes",
  scheme: "meetingnotes",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  splash: {
    image: "./assets/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff",
  },
  ios: {
    bundleIdentifier: "com.meetingnotes.app",
    supportsTablet: true,
    googleServicesFile: "./GoogleService-Info.plist",
    // iOS Universal Links — only emitted when EXPO_PUBLIC_DEEP_LINK_HOST is set.
    // Requires hosting an apple-app-site-association file at https://<host>/.well-known/.
    associatedDomains: DEEP_LINK_HOST
      ? [`applinks:${DEEP_LINK_HOST}`]
      : undefined,
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      UIBackgroundModes: ["audio", "remote-notification", "fetch"],
      NSAppTransportSecurity: {
        NSAllowsArbitraryLoads: true,
        NSAllowsLocalNetworking: true,
      },
    },
  },
  android: {
    package: "com.meetingnotes.app",
    googleServicesFile: "./google-services.json",
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#ffffff",
    },
    permissions: [
      "android.permission.FOREGROUND_SERVICE",
      "android.permission.FOREGROUND_SERVICE_MICROPHONE",
      "android.permission.POST_NOTIFICATIONS",
      "android.permission.WAKE_LOCK",
    ],
    // Android App Links — only emitted when EXPO_PUBLIC_DEEP_LINK_HOST is set.
    // Requires hosting an assetlinks.json file at https://<host>/.well-known/.
    intentFilters: DEEP_LINK_HOST
      ? [
          {
            action: "VIEW",
            autoVerify: true,
            data: [{ scheme: "https", host: DEEP_LINK_HOST, pathPrefix: "/" }],
            category: ["BROWSABLE", "DEFAULT"],
          },
        ]
      : undefined,
  },
  plugins: [
    "expo-router",
    [
      "expo-audio",
      {
        enableBackgroundRecording: true,
        microphonePermission:
          "We record your meeting audio so we can transcribe and summarize it.",
      },
    ],
    "expo-secure-store",
    "@react-native-firebase/app",
    "@react-native-firebase/messaging",
    [
      "expo-build-properties",
      {
        android: {
          compileSdkVersion: 35,
          targetSdkVersion: 35,
          buildToolsVersion: "35.0.0",
          minSdkVersion: 24,
          kotlinVersion: "2.1.20",
        },
        ios: {
          deploymentTarget: "15.1",
          useFrameworks: "static",
          forceStaticLinking: ["RNFBApp"],
        },
      },
    ],
  ],
  extra: {
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:8000",
    eas: {
      projectId: process.env.EXPO_PROJECT_ID ?? "",
    },
  },
  experiments: {
    typedRoutes: true,
  },
};

export default config;
