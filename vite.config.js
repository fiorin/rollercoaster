import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import bundleAnalyzer from "vite-bundle-analyzer";

/**
 * Resolves the npm package a module belongs to.
 * e.g. ".../node_modules/@remix-run/router/dist/router.js" -> "@remix-run/router"
 */
function packageName(id) {
  const marker = "node_modules/";
  const index = id.lastIndexOf(marker);
  if (index === -1) return "";
  const rest = id.slice(index + marker.length).split("/");
  return rest[0].startsWith("@") ? `${rest[0]}/${rest[1]}` : rest[0];
}

// Recharts v3 drags in the whole Redux stack (toolkit, react-redux, reselect,
// immer) plus the d3 family and victory-vendor. Without an explicit grouping
// those land in the vendor chunk, which every page downloads on first paint.
const RECHARTS_PACKAGES = new Set([
  "recharts",
  "victory-vendor",
  "es-toolkit",
  "decimal.js-light",
  "eventemitter3",
  "internmap",
  "clsx",
  "tiny-invariant",
  "react-is",
  "@reduxjs/toolkit",
  "react-redux",
  "redux",
  "redux-thunk",
  "reselect",
  "immer",
  "use-sync-external-store",
]);

const ROUTER_PACKAGES = new Set([
  "react-router",
  "react-router-dom",
  "@remix-run/router",
]);

export default defineConfig({
  plugins: [
    react(),
    ...(process.env.ANALYZE === "true" ? [bundleAnalyzer()] : []),
  ],
  resolve: {
    dedupe: ["react", "react-dom"],
  },
  server: {
    host: "localhost",
    port: 5173,
    strictPort: true,
    hmr: {
      protocol: "ws",
      host: "localhost",
      port: 5173,
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "src/setupTests.js",
    include: ["src/**/*.{test,spec}.{js,jsx}"],
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          const pkg = packageName(id);

          if (RECHARTS_PACKAGES.has(pkg) || pkg.startsWith("d3-")) {
            return "recharts";
          }
          if (ROUTER_PACKAGES.has(pkg)) return "router";
          if (pkg.startsWith("@supabase")) return "supabase";
          return "vendor";
        },
      },
    },
  },
});
