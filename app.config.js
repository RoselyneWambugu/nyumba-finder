require("dotenv").config();

module.exports = {
  expo: {
    name: "Nyumba Finder",
    slug: "nyumba-finder",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "automatic",
    splash: {
      backgroundColor: "#0F766E"
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.nyumbafinder.app"
    },
    android: {
      adaptiveIcon: {
        backgroundColor: "#0F766E"
      },
      package: "com.nyumbafinder.app",
      permissions: ["CAMERA", "READ_EXTERNAL_STORAGE"]
    },
    web: {
      bundler: "metro"
    },
    extra: {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY
    }
  }
};
