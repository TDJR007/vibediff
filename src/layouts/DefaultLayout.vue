<script setup lang="ts">
    import { RouterLink, RouterView } from 'vue-router'
    import Button from 'primevue/button'
    import { useThemeStore } from '@/stores/themeStore'
    import { storeToRefs } from 'pinia'
    
    const themeStore = useThemeStore()
    const { mode } = storeToRefs(themeStore)
    
    const toggleTheme = () => {
      let next: 'light' | 'dark' | 'system'
      if (mode.value === 'system') next = 'dark'
      else if (mode.value === 'dark') next = 'light'
      else next = 'system'
      
      themeStore.setMode(next)
    }
    </script>
    
    <template>
      <div class="min-h-screen flex flex-col">
        <!-- Navbar -->
        <nav class="bg-surface-0 dark:bg-surface-950 border-b border-surface-200 dark:border-surface-800 p-4 shadow-sm">
          <div class="container mx-auto flex justify-between items-center">
            <div class="flex items-center gap-8">
              <RouterLink to="/" class="text-2xl font-bold text-primary-600 dark:text-primary-400">
                VibeDiff
              </RouterLink>
              <div class="flex gap-6 text-lg">
                <RouterLink to="/" class="hover:text-primary-600 dark:hover:text-primary-400">Home</RouterLink>
                <RouterLink to="/my-diffs" class="hover:text-primary-600 dark:hover:text-primary-400">My Diffs</RouterLink>
                <RouterLink to="/about" class="hover:text-primary-600 dark:hover:text-primary-400">About</RouterLink>
              </div>
            </div>
    
            <!-- Dark mode toggle -->
            <Button
              :icon="mode === 'dark' ? 'pi pi-sun' : mode === 'light' ? 'pi pi-moon' : 'pi pi-circle-fill'"
              class="p-button-rounded p-button-text p-button-plain"
              @click="toggleTheme"
              v-tooltip.bottom="`Theme: ${mode}`"
            />
          </div>
        </nav>
    
        <!-- Page content -->
        <main class="flex-grow container mx-auto p-6">
          <RouterView />
        </main>
      </div>
    </template>