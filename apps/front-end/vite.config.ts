import fs from "node:fs";
import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type PluginOption } from "vite";

/**
 * Bitrix24 sends POST requests to /install (and handler routes).
 * Vite's SPA fallback only handles GET, so POST returns 404.
 * This plugin intercepts non-GET requests to SPA routes and
 * serves the transformed index.html directly — same as Nuxt does
 * for all non-API routes regardless of HTTP method.
 */
function spaPostFallback(): PluginOption {
  return {
    name: "spa-post-fallback",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (
          req.method !== "GET" &&
          req.url &&
          !req.url.startsWith("/api") &&
          !new URL(req.url, "http://localhost").pathname.includes(".")
        ) {
          const htmlPath = path.resolve(server.config.root, "index.html");
          const raw = fs.readFileSync(htmlPath, "utf-8");
          const html = await server.transformIndexHtml(req.url, raw);

          res.setHeader("Content-Type", "text/html");
          res.statusCode = 200;
          res.end(html);
          return;
        }
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [
    spaPostFallback(),
    react({
      babel: {
        plugins: [["babel-plugin-react-compiler"]],
      },
    }),
    tailwindcss(),
  ],
  server: {
    host: "0.0.0.0",
    allowedHosts: true,
    proxy: {
      "/api": {
        target: process.env.API_URL || "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
