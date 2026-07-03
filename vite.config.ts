import { readFileSync } from "node:fs";

import react from "@vitejs/plugin-react";
import webExtension from "vite-plugin-web-extension";
import { defineConfig } from "vitest/config";



const pkg = JSON.parse(readFileSync("./package.json", "utf-8")) as { version: string };

export default defineConfig(({ mode }) => ({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [
    react(),
    ...(mode === "production" ? [webExtension({ manifest: "public/manifest.json" })] : []),
  ],
  envPrefix: "REACT_APP_",
  build: {
    outDir: "build",
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/setupTests.ts"],
    globals: true,
  },
}));
