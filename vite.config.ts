import { defineConfig } from "@tanstack/react-start/config";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import tsConfigPaths from "vite-tsconfig-paths";
import vercelPreset from "@tanstack/react-start/vercel";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";

export default defineConfig({
  preset: vercelPreset(),
  server: {
    entry: "src/server.ts",
  },
  vite: {
    plugins: [
      TanStackRouterVite({ quoteStyle: "single" }),
      tailwindcss(),
      react(),
      tsConfigPaths(),
    ],
  },
});
