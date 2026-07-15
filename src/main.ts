import { createApp } from 'vue'
import App from './App.vue'
import vuetify from './plugins/vuetify'
import { createPinia } from 'pinia'

const app = createApp(App)

const pinia = createPinia()

app.use(vuetify)
app.use(pinia);
app.mount('#app')
