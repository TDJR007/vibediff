<script setup lang="ts">
  import { ref } from 'vue'
  import Button from 'primevue/button'
  
  const count = ref(0)
  </script>
  
  <template>
    <div class="p-8 text-center">
      <h1 class="text-4xl font-bold mb-6">VibeDiff</h1>
      
      <p class="text-lg mb-8">
        Welcome! PrimeVue should be working now ✨
      </p>
  
      <div class="flex justify-center gap-4">
        <Button 
          label="Click me!" 
          severity="success" 
          @click="count++"
        />
        <p class="text-2xl font-bold self-center">
          Count: {{ count }}
        </p>
      </div>
  
      <p class="mt-12 text-sm text-gray-500">
        If you see a nice green button, PrimeVue is working!
      </p>
    </div>
  </template>
  
  <style>
  body {
    background-color: var(--p-surface-ground);
    color: var(--p-text-color);
  }
  </style>