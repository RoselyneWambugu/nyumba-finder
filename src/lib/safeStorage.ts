// Persists the onboarding flag and Supabase session across app restarts using
// expo-file-system's File/Directory API.
//
// This intentionally does NOT use @react-native-async-storage/async-storage.
// That package's native module failed to initialize on at least one real Expo
// Go SDK 57 install ("Native module is null, cannot access legacy storage"),
// deep enough inside the library that try/catch here didn't contain it.
// expo-file-system is a core, Expo-maintained module with no such
// native-linking fragility, and unlike expo-secure-store it has no ~2KB
// per-value ceiling — a full Supabase session (access + refresh token + user
// object) can exceed that.
import { Directory, File, Paths } from "expo-file-system";

const storageDir = new Directory(Paths.document, "nf-storage");

function fileFor(key: string): File {
  const safeName = key.replace(/[^a-zA-Z0-9._-]/g, "_");
  return new File(storageDir, `${safeName}.txt`);
}

function ensureDir(): void {
  if (!storageDir.exists) {
    storageDir.create({ intermediates: true, idempotent: true });
  }
}

async function getItem(key: string): Promise<string | null> {
  try {
    const file = fileFor(key);
    if (!file.exists) return null;
    return await file.text();
  } catch (err) {
    console.warn("[safeStorage] getItem failed, treating as empty", key, err);
    return null;
  }
}

async function setItem(key: string, value: string): Promise<void> {
  try {
    ensureDir();
    fileFor(key).write(value);
  } catch (err) {
    console.warn("[safeStorage] setItem failed, value will not persist", key, err);
  }
}

async function removeItem(key: string): Promise<void> {
  try {
    const file = fileFor(key);
    if (file.exists) file.delete();
  } catch (err) {
    console.warn("[safeStorage] removeItem failed", key, err);
  }
}

export const safeStorage = { getItem, setItem, removeItem };
