<script setup lang="ts">
    import Button from 'primevue/button'
    
    defineEmits<{
      createNew: []
    }>()
    </script>
    
    <template>
      <div class="text-center py-20">
        <i class="pi pi-inbox text-6xl text-surface-400 dark:text-surface-600 mb-6 block"></i>
        <h2 class="text-2xl font-semibold text-surface-700 dark:text-surface-300 mb-3">
          No saved diffs yet
        </h2>
        <p class="text-surface-600 dark:text-surface-400 mb-8 max-w-md mx-auto">
          Start comparing texts and save your merges to build your library!
        </p>
        <Button
          label="Create Your First Diff"
          icon="pi pi-plus"
          class="p-button-raised"
          @click="$emit('createNew')"
        />
      </div>
    </template>