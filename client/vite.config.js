createConfig = () => {
    const config = defineConfig({
        server: {
            hmr: {
                host: "localhost":,
                port: 9000,
                protocol: "ws",
            },
        },
    });
    console.log("vite config:", config"

    return config;
}

export default createConfig()
