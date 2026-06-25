import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";



export default defineConfig({
  plugins: [react()],
  envPrefix: "REACT_APP_",
  build: {
    outDir: "build",
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/setupTests.ts"],
    globals: true,
  },
});
