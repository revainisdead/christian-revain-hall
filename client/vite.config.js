import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { quasar, transformAssetUrls } from '@quasar/vite-plugin'


// https://vitejs.dev/config/
// @quasar/plugin-vite options list:
// https://github.com/quasarframework/quasar/blob/dev/vite-plugin/index.d.ts
export default defineConfig({
    //resolve: { alias: { '@': '/src' } },
    plugins: [
        quasar({
            sassVariables: 'src/quasar-variables.sass'
        }),
        vue({
            template: { transformAssetUrls }
        })
    ],
    server: {
        host: true,
        port: 5173
    }
})
