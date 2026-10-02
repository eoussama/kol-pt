import { get, ref, set, update } from "firebase/database";
import { getFirebaseDatabase } from "./firebase";



/**
 * @description
 * Reads a value from the Realtime Database.
 *
 * @param path - The value's path
 * @returns Promise resolving to the raw value, null if absent
 */
export async function readValue(path: string): Promise<unknown> {
  const snapshot = await get(ref(getFirebaseDatabase(), path));

  return snapshot.val();
}

/**
 * @description
 * Replaces a value in the Realtime Database.
 *
 * @param path - The value's path
 * @param value - The new value, null to delete it
 * @returns Promise that resolves once written
 */
export async function writeValue(path: string, value: unknown): Promise<void> {
  await set(ref(getFirebaseDatabase(), path), value);
}

/**
 * @description
 * Updates some children of a value in the Realtime Database, leaving the
 * others untouched.
 *
 * @param path - The parent's path
 * @param values - The children to write, by key
 * @returns Promise that resolves once written
 */
export async function updateValues(path: string, values: Record<string, unknown>): Promise<void> {
  await update(ref(getFirebaseDatabase(), path), values);
}
