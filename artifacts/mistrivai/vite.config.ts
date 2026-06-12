import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

const rawPort = process.env.PORT;
const port = rawPort ? Number(rawPort) : 25062;

const basePath = process.env.BASE_PATH ?? "/";

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, ".."),
            }),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
    },
    proxy: {
      '/login': { target: 'http://localhost:5001', changeOrigin: true, secure: false },
      '/logout': { target: 'http://localhost:5001', changeOrigin: true, secure: false },
      '/signup': { target: 'http://localhost:5001', changeOrigin: true, secure: false },
      '/profile': { target: 'http://localhost:5001', changeOrigin: true, secure: false },
      '/api': { target: 'http://localhost:5001', changeOrigin: true, secure: false },
      '/mechanics': { target: 'http://localhost:5001', changeOrigin: true, secure: false },
      '/mechanic': { target: 'http://localhost:5001', changeOrigin: true, secure: false },
      '/admin': { target: 'http://localhost:5001', changeOrigin: true, secure: false },
      '/bookings': { target: 'http://localhost:5001', changeOrigin: true, secure: false },
      '/messages': { target: 'http://localhost:5001', changeOrigin: true, secure: false },
      '/reviews': { target: 'http://localhost:5001', changeOrigin: true, secure: false },
      '/emergency': { target: 'http://localhost:5001', changeOrigin: true, secure: false },
      '/update-profile': { target: 'http://localhost:5001', changeOrigin: true, secure: false },
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
