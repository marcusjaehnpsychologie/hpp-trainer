import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base "./" damit die App auch unter https://<user>.github.io/praxis-kartei/ läuft
export default defineConfig({
  base: "./",
  plugins: [react()],
});
