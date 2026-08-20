// app.config.js
module.exports = ({ config }) => {
  // Determine environment from EAS_BUILD_PROFILE or default to 'dev'
  const environment = process.env.EXPO_PUBLIC_APP_VARIANT || "dev";

  const name = "Task Management";
  const bundleIdentifier = "com.anonymous.task_management";

  // Define environment-specific configurations
  const envSettings = {
    dev: {
      name: `${name} (Dev)`,
      bundleIdentifier: `${bundleIdentifier}.dev`,
    },
    staging: {
      name: `${name} (Staging)`,
      bundleIdentifier: `${bundleIdentifier}.staging`,
    },
    production: {
      name,
      bundleIdentifier,
    },
  };

  const currentEnv = envSettings[environment] ?? envSettings.dev;

  console.log(`Environment: ${JSON.stringify(currentEnv)}`);

  return {
    ...config,
    name: currentEnv.name,
    slug: "task_management",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "task_management",
    userInterfaceStyle: "automatic",
    android: {
      ...config.android,
      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
        foregroundImage: "./assets/images/android-icon-foreground.png",
        backgroundImage: "./assets/images/android-icon-background.png",
        monochromeImage: "./assets/images/android-icon-monochrome.png",
      },
      predictiveBackGestureEnabled: false,
      googleServicesFile: "./google-services/google-services.json",
      package: currentEnv.bundleIdentifier,
    },
    ios: {
      ...config.ios,
      icon: "./assets/expo.icon",
      bundleIdentifier: currentEnv.bundleIdentifier,
    },
    web: {
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          backgroundColor: "#208AEF",
          image: "./assets/images/splash-icon.png",
          imageWidth: 76,
        },
      ],
      [
        "expo-build-properties",
        {
          android: {
            usesCleartextTraffic: true,
          },
        },
      ],
      [
        "expo-notifications",
        {
          icon: "./assets/images/notification_icon.png",
        },
      ],
      "expo-image",
      "expo-sqlite",
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      router: {},
      eas: {
        projectId: "650a58ab-c24e-4b27-bf3b-6bbef86d90b9",
      },
      environment,
    },
  };
};
