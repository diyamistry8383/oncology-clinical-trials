import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Inside docker-compose, "localhost" refers to the frontend container
// itself, not the backend container — so the proxy target must be the
// backend service name ("backend") when running via Docker, but
// "localhost" when running `npm run dev` directly on a host machine.
// VITE_BACKEND_HOST lets docker-compose override this without code changes.
const backendHost = process.env.VITE_BACKEND_HOST || "localhost";

export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        host: true,
        proxy: {
            // Lets the frontend call relative /api/* paths instead of
            // hardcoding a host/port in every component.
            "/api": {
                target: `http://${backendHost}:8001`,
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api/, ""),
            },
        },
    },
});