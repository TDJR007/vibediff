<!-- src/layouts/DefaultLayout.vue -->
<script setup lang="ts">
import { useRoute } from 'vue-router'
import Button from 'primevue/button'
import { useThemeStore } from '@/stores/themeStore'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'

const route = useRoute()
const themeStore = useThemeStore()
const { mode } = storeToRefs(themeStore)

// Toggle only light ↔ dark
const toggleTheme = () => {
  const next = mode.value === 'dark' ? 'light' : 'dark'
  themeStore.setMode(next)
}

const themeIcon = computed(() =>
  mode.value === 'dark' ? 'pi pi-sun' : 'pi pi-moon'
)
</script>

<template>
  <div class="min-h-screen flex flex-col bg-surface-ground text-surface-900 dark:bg-surface-950 dark:text-surface-0">
    <!-- Navbar -->
    <nav
      class="bg-surface-0 dark:bg-surface-950 border-b border-surface-200 dark:border-surface-800 shadow-sm sticky top-0 z-50">
      <div class="container mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-end h-14"> <!-- Reduced from h-16 -->
          <div class="flex items-center gap-3">
            <!-- Nav Buttons -->
            <Button
              as="router-link"
              to="/"
              label="Home"
              class="p-button-text p-button-sm px-4 py-1.5 rounded-md transition-all duration-200 hover:shadow-sm hover:bg-primary-50 dark:hover:bg-primary-900 no-underline"
              :class="{
                '!bg-primary-600 !text-white hover:!bg-primary-700': route.path === '/',
                '!text-surface-700 dark:!text-surface-300': route.path !== '/'
              }" />

            <Button
              as="router-link"
              to="/my-diffs"
              label="My Diffs"
              class="p-button-text p-button-sm px-4 py-1.5 rounded-md transition-all duration-200 hover:shadow-sm hover:bg-primary-50 dark:hover:bg-primary-900 no-underline"
              :class="{
                '!bg-primary-600 !text-white hover:!bg-primary-700': route.path === '/my-diffs',
                '!text-surface-700 dark:!text-surface-300': route.path !== '/my-diffs'
              }" />

            <Button
              as="router-link"
              to="/about"
              label="About"
              class="p-button-text p-button-sm px-4 py-1.5 rounded-md transition-all duration-200 hover:shadow-sm hover:bg-primary-50 dark:hover:bg-primary-900 no-underline"
              :class="{
                '!bg-primary-600 !text-white hover:!bg-primary-700': route.path === '/about',
                '!text-surface-700 dark:!text-surface-300': route.path !== '/about'
              }" />

            <!-- Theme toggle -->
            <Button
              :icon="themeIcon"
              class="p-button-rounded p-button-text flex items-center justify-center transition-colors hover:bg-surface-100 dark:hover:bg-surface-800"
              style="width: 40px; height: 40px;"
              @click="toggleTheme"
              v-tooltip.bottom="`Toggle ${mode === 'dark' ? 'Light' : 'Dark'} Mode`" />
          </div>
        </div>
      </div>
    </nav>

    <!-- Main content with optimal spacing -->
    <main class="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
/* Kill underlines */
a,
button[as="router-link"],
button {
  text-decoration: none !important;
}
</style>