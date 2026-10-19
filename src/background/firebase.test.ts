import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth/web-extension";
import { getDatabase } from "firebase/database";
import { getFirebaseApp, getFirebaseAuth, getFirebaseDatabase } from "./firebase";



const config = { apiKey: "key", projectId: "kol-pt" };
const app = { name: "app" };

vi.mock("firebase/app", () => ({ initializeApp: vi.fn(() => app) }));
vi.mock("firebase/auth/web-extension", () => ({ getAuth: vi.fn(() => ({ kind: "auth" })) }));
vi.mock("firebase/database", () => ({ getDatabase: vi.fn(() => ({ kind: "database" })) }));
vi.mock("../config/env", () => ({ getFirebaseConfig: vi.fn(() => config) }));

describe("firebase", () => {
  it("creates the app once, from the build configuration", () => {
    expect(getFirebaseApp()).toBe(app);
    expect(getFirebaseApp()).toBe(app);
    expect(initializeApp).toHaveBeenCalledExactlyOnceWith(config);
  });

  it("gives Auth and the Realtime Database the same app", () => {
    expect(getFirebaseAuth()).toEqual({ kind: "auth" });
    expect(getAuth).toHaveBeenCalledWith(app);
    expect(getFirebaseDatabase()).toEqual({ kind: "database" });
    expect(getDatabase).toHaveBeenCalledWith(app);
  });
});
