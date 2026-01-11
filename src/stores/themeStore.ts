// src/stores/themeStore.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  const mode = ref<'light' | 'dark'>('dark') // default to dark (or 'light' if you prefer)

  const setMode = (newMode: 'light' | 'dark') => {
    mode.value = newMode
    const isDark = newMode === 'dark'
    document.documentElement.classList.toggle('p-dark', isDark)
    localStorage.setItem('theme-mode', newMode)
  }

  // Load saved preference
  const saved = localStorage.getItem('theme-mode') as 'light' | 'dark' | null
  if (saved) {
    mode.value = saved
    document.documentElement.classList.toggle('p-dark', saved === 'dark')
  }

  return { mode, setMode }
})