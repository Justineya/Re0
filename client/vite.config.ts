import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  // Project Pages URL: https://Justineya.github.io/Re0/
  base: "/Re0/",
  plugins: [react()],
  resolve: {
    alias: {
      "@data": path.resolve(root, "../game/data"),
      "@portraits": path.resolve(root, "../game/assets/portraits"),
    },
  },
  server: {
    host: true,
    port: 5173,
    fs: { allow: [path.resolve(root, "..")] },
  },
  test: {
    environment: "node",
  },
});
