import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { defineAsyncComponent } from 'vue'
import router from './router'

// PrimeVue imports
import PrimeVue from 'primevue/config'
import Aura from '@primevue/themes/aura'   
import Tooltip from 'primevue/tooltip'
import 'primeicons/primeicons.css'
import Toast from 'primevue/toast'
import ToastService from 'primevue/toastservice'
import ConfirmDialog from 'primevue/confirmdialog'
import ConfirmationService from 'primevue/confirmationservice'


// Optional: add ripple effect (nice touch for buttons etc.)
import Ripple from 'primevue/ripple'

const app = createApp(App)
app.use(createPinia())

// Register PrimeVue with theme
app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {
      prefix: 'p',
      darkModeSelector: '.p-dark',   // ← Important: now using class instead of system
      cssLayer: false
    }
  },
  ripple: true
})

app.use(router)  // ← Add this line
app.use(ToastService)

app.use(ConfirmationService)

// Global registration of frequently used components (optional but saves imports)
app.component('Button', defineAsyncComponent(() => import('primevue/button')))
app.component('InputText', defineAsyncComponent(() => import('primevue/inputtext')))
app.component('Textarea', defineAsyncComponent(() => import('primevue/textarea')))
app.component('Splitter', defineAsyncComponent(() => import('primevue/splitter')))
app.component('SplitterPanel', defineAsyncComponent(() => import('primevue/splitterpanel')))
app.component('Toast', Toast)
app.component('ConfirmDialog', ConfirmDialog)
app.directive('tooltip', Tooltip)
// You can add more later as we use them

app.mount('#app')