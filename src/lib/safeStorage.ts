// In-memory storage for the onboarding flag and Supabase session.
//
// This intentionally does NOT use @react-native-async-storage/async-storage.
// That package's native module has been failing to initialize on at least one
// real Expo Go SDK 57 install ("Native module is null, cannot access legacy
// storage"), and the failure happens deep enough inside the library that
// wrapping calls in try/catch here didn't fully contain it. Persisted state
// (staying logged in / onboarding-seen across app restarts) is a nice-to-have,
// not a functional requirement, so trading it away buys a version of the app
// that reliably runs everywhere instead of one that occasionally hangs blank.
const memory = new Map<string, string>();

async function getItem(key: string): Promise<string | null> {
  return memory.get(key) ?? null;
}

async function setItem(key: string, value: string): Promise<void> {
  memory.set(key, value);
}

async function removeItem(key: string): Promise<void> {
  memory.delete(key);
}

export const safeStorage = { getItem, setItem, removeItem };
