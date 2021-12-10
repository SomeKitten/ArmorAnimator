// vite.config.js
export default {
    root: './project',
    build: {
        outDir: '../dist',
        target: 'esnext',
    },
    server: {
        cors: true,
    },
    publicDir: './res',
}
