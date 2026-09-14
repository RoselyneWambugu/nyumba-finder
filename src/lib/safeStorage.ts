import AsyncStorage from "@react-native-async-storage/async-storage";

// Wraps AsyncStorage so a broken native module (seen on some Expo Go builds)
// degrades to in-memory storage instead of throwing and blanking the app.
// Falls back per-call, so it keeps working normally the moment the native
// module recovers (e.g. after an app restart on a fixed environment).
const memoryFallback = new Map<string, string>();

async function getItem(key: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(key);
  } catch (err) {
    console.warn("[safeStorage] AsyncStorage.getItem failed, using in-memory fallback", err);
    return memoryFallback.get(key) ?? null;
  }
}

async function setItem(key: string, value: string): Promise<void> {
  try {
    await AsyncStorage.setItem(key, value);
  } catch (err) {
    console.warn("[safeStorage] AsyncStorage.setItem failed, using in-memory fallback", err);
    memoryFallback.set(key, value);
  }
}

async function removeItem(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch (err) {
    console.warn("[safeStorage] AsyncStorage.removeItem failed, using in-memory fallback", err);
    memoryFallback.delete(key);
  }
}

export const safeStorage = { getItem, setItem, removeItem };
