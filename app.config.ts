import { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => {
  // Expo SDK 49+ automatically loads .env.development / .env.production etc.
  // and injects EXPO_PUBLIC_* variables into process.env before this file runs.
  // No manual dotenv loading is needed here.
  const appEnv = process.env.EXPO_PUBLIC_APP_ENV ?? "development";

  return {
    ...config,
    name: appEnv === "production" ? "AfroPlan" : `AfroPlan (${appEnv})`,
    slug: "afroplan",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "afroplan",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    splash: {
      image: "./assets/images/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#191919",
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.afroplan.app",
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/android-icon-foreground.png",
        backgroundImage: "./assets/images/android-icon-background.png",
        monochromeImage: "./assets/images/android-icon-monochrome.png",
      },
      package: "com.afroplan.app",
      versionCode: 1,
      permissions: [
        "android.permission.INTERNET",
        "android.permission.CAMERA",
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.RECORD_AUDIO",
        "android.permission.ACCESS_FINE_LOCATION",
        "android.permission.ACCESS_COARSE_LOCATION",
      ],
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      "expo-router",
      "expo-secure-store",
      "expo-image-picker",
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission:
            "AfroPlan utilise votre position pour trouver les salons de coiffure près de chez vous.",
          locationWhenInUsePermission:
            "AfroPlan utilise votre position pour trouver les salons de coiffure près de chez vous.",
        },
      ],
      [
        "@stripe/stripe-react-native",
        {
          merchantIdentifier: "merchant.com.afroplan.app",
          enableGooglePay: true,
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      router: {
        origin: false,
      },
      eas: {
        projectId: "b133bcbd-6f4e-465b-99d8-66efa944eaa9",
      },
      appEnv,
    },
  };
};
