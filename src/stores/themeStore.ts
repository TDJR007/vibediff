import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  const mode = ref<'light' | 'dark' | 'system'>('system')

  // This will be called when user changes preference
  const setMode = (newMode: 'light' | 'dark' | 'system') => {
    mode.value = newMode
    
    // We'll sync this with PrimeVue in main.ts later
    if (newMode === 'system') {
      document.documentElement.classList.remove('p-dark')
      localStorage.removeItem('theme-mode')
    } else {
      const isDark = newMode === 'dark'
      document.documentElement.classList.toggle('p-dark', isDark)
      localStorage.setItem('theme-mode', newMode)
    }
  }

  // Load from localStorage on init
  const saved = localStorage.getItem('theme-mode') as 'light' | 'dark' | null
  if (saved && (saved === 'light' || saved === 'dark')) {
    mode.value = saved
    document.documentElement.classList.toggle('p-dark', saved === 'dark')
  }

  return { mode, setMode }
})