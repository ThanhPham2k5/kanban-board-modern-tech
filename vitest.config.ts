import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "jsdom",
    exclude: ["**/node_modules/**", "**/e2e/**", "**/tests/**"],
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
  },
});
