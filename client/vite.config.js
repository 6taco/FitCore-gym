import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
        },
    },
    server: {
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://localhost:4000',
                changeOrigin: true,
            },
        },
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    'vendor-react': ['react', 'react-dom', 'react-router-dom'],
                    'vendor-antd': ['antd', '@ant-design/icons'],
                    'vendor-echarts': ['echarts'],
                    'vendor-utils': ['axios', 'dayjs', 'zustand'],
                },
            },
        },
    },
});
