import { createApp } from 'vue'
import App from './App.vue'
import { defineAsyncComponent } from 'vue'

// PrimeVue imports
import PrimeVue from 'primevue/config'
import Aura from '@primevue/themes/aura'   // ← modern, clean theme (Lara successor)

// Optional: add ripple effect (nice touch for buttons etc.)
import Ripple from 'primevue/ripple'

const app = createApp(App)

// Register PrimeVue with theme
app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {
      prefix: 'p',
      darkModeSelector: 'system',     // respects system preference
      cssLayer: false
    }
  },
  ripple: true
})

// Global registration of frequently used components (optional but saves imports)
app.component('Button', defineAsyncComponent(() => import('primevue/button')))
app.component('InputText', defineAsyncComponent(() => import('primevue/inputtext')))
app.component('Textarea', defineAsyncComponent(() => import('primevue/textarea')))
// You can add more later as we use them

app.mount('#app')