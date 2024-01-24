import { createApp } from 'vue'
import { Quasar } from 'quasar'
import '@quasar/extras/material-icons/material-icons.css'   // Import icon libraries
import 'quasar/src/css/index.sass'  // Import Quasar css

// Assumes your root component is App.vue
// and placed in same folder as main.js
import App from './App.vue'
import './style.css'


const crhApp = createApp(App)

crhApp.use(Quasar, {
  plugins: {}, // import Quasar plugins and add here
})


// Assumes you have a <div id=app></div> in your index.html
crhApp.mount('#app')
