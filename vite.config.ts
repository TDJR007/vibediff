import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'; // Import the path module

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      // Set up the '@' alias to resolve to the 'src' directory
      '@': path.resolve(__dirname, './src'),
    },
  },
})
