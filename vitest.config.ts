import { readFileSync } from "node:fs";

import { defineConfig } from "vitest/config";
import { WxtVitest } from "wxt/testing/vitest-plugin";



const pkg = JSON.parse(readFileSync("./package.json", "utf-8")) as { version: string };

export default defineConfig({
  plugins: [WxtVitest()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  envPrefix: ["WXT_", "VITE_"],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
  },
});
