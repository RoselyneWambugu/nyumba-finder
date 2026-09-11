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
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#FAF6F3"
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.nyumbafinder.app"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#0C5952"
      },
      package: "com.nyumbafinder.app",
      permissions: ["CAMERA", "READ_EXTERNAL_STORAGE"]
    },
    web: {
      bundler: "metro",
      favicon: "./assets/favicon.png"
    },
    extra: {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY
    }
  }
};
