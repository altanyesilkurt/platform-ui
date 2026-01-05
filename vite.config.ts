import { defineConfig } from 'vite'
import path from 'path'
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
    server: {
        host: '::',
        port: 9090,
    },
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
})
