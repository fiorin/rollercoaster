import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import bundleAnalyzer from "vite-bundle-analyzer";

export default defineConfig({
  plugins: [
    react(),
    ...(process.env.ANALYZE === "true" ? [bundleAnalyzer()] : []),
  ],
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("recharts")) {
              return "recharts";
            }
            if (id.includes("dayjs")) {
              return "dayjs";
            }
            if (id.includes("react-router-dom")) {
              return "router";
            }
            if (id.includes("supabase")) {
              return "supabase";
            }
            return "vendor";
          }
        },
      },
    },
  },
});
