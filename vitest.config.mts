import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  resolve: {
    alias: {
      // `server-only` exists to throw at module load in client bundles; in vitest it would block
      // every server-side test that imports a server-marked module. Stub to a no-op for tests.
      "server-only": new URL("./vitest.shims/server-only.ts", import.meta.url).pathname,
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    include: ["packages/**/*.test.ts", "packages/**/*.test.tsx", "apps/**/*.test.tsx"],
    setupFiles: ["./vitest.setup.ts"],
  },
});
