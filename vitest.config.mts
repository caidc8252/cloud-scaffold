import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  resolve: {
    alias: {
      // `server-only` / `client-only` throw at module load to enforce bundle isolation;
      // in vitest they would block every test that imports a marked module. Stub to no-ops.
      "server-only": new URL("./vitest.shims/server-only.ts", import.meta.url).pathname,
      "client-only": new URL("./vitest.shims/client-only.ts", import.meta.url).pathname,
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    include: [
      "packages/**/*.test.ts",
      "packages/**/*.test.tsx",
      "apps/**/*.test.ts",
      "apps/**/*.test.tsx",
    ],
    setupFiles: ["./vitest.setup.ts"],
  },
});
