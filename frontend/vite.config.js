import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const rootDir = globalThis.process?.cwd?.() ?? ".";
  const env = loadEnv(mode, rootDir, "");
  const proxyTarget = env.VITE_GATEWAY_PROXY_TARGET || "http://localhost:5026";

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        "/api": {
          target: proxyTarget,
          changeOrigin: true
        }
      }
    }
  };
});
