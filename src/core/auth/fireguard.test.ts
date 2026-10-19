import { appConfig } from "../../config/app";
import { FIREGUARD_SIZE, getFiremittOptions } from "./fireguard";



vi.mock("../../config/env", () => ({
  getFirebaseConfig: () => ({
    apiKey: "key",
    appId: "app",
    authDomain: "auth.test",
    databaseURL: "https://db.test",
    measurementId: "G-1",
    messagingSenderId: "sender",
    projectId: "project",
    storageBucket: "bucket",
  }),
}));



describe("getFiremittOptions", () => {
  it("points Firemitt at the Fireguard page, sized for its card", () => {
    const options = getFiremittOptions();

    expect(options.url).toBe(appConfig.fireguardUrl);
    expect(options.dim).toEqual({ width: 450, height: 260 });
    expect(options.dim).not.toBe(FIREGUARD_SIZE);
  });

  it("brands the card for the extension", () => {
    const { config } = getFiremittOptions();

    expect(config?.name).toBe("KOL PT");
    expect(config?.logo).toMatch(/^https:\/\/github\.com\/eoussama\/kol-pt\/.*icon128x128\.png/);
    expect(config?.theme).toEqual({ text: "#222833", primary: "#1976d2", secondary: "#222833" });
  });

  it("hands over only the Firebase settings sign-in needs", () => {
    expect(getFiremittOptions().config?.firebase).toEqual({
      apiKey: "key",
      appId: "app",
      authDomain: "auth.test",
      measurementId: "G-1",
      messagingSenderId: "sender",
      projectId: "project",
      storageBucket: "bucket",
    });
  });
});
