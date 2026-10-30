import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("/node_modules/@mui/icons-material/")) return "mui-icons"
          if (id.includes("/node_modules/@mui/") || id.includes("/node_modules/@emotion/")) return "mui"
          if (id.includes("/node_modules/react/") || id.includes("/node_modules/react-dom/")) return "react"
          if (id.includes("/node_modules/qrcode/") || id.includes("/node_modules/dijkstrajs/")) return "qr"
        },
      },
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.js"],
  },
})
