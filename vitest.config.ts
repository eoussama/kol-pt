import { readFileSync } from "node:fs";

import { configDefaults, defineConfig } from "vitest/config";
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
    // Stryker's sandboxes hold copies of the tests
    exclude: [...configDefaults.exclude, ".stryker-tmp/**", "reports/**"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.test.{ts,tsx}",
        "src/test/**",
        "src/**/__fixtures__/**",
        "src/**/*.d.ts",
        "src/core/types/**",
        // Vendored shadcn/ui components: third-party code, covered through the components that use them
        "src/components/ui/**",
        // Wiring that only connects the tested modules to the browser (WXT entry points)
        "src/entrypoints/**",
      ],
      reporter: ["text-summary", "html", "lcov"],
      // Coverage may not drop: new code comes with its tests
      thresholds: { statements: 100, branches: 100, functions: 100, lines: 100 },
      reportsDirectory: "coverage",
    },
  },
});
