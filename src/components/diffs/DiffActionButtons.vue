<script setup lang="ts">
    import Button from 'primevue/button'
    import type { SavedDiff } from '@/composables/useDiffStorage'
    
    defineProps<{
      diff: SavedDiff
    }>()
    
    defineEmits<{
      load: [diff: SavedDiff]
      export: [diff: SavedDiff]
      delete: [diff: SavedDiff]
    }>()
    </script>
    
    <template>
      <div class="flex items-center justify-end gap-2">
        <Button
          icon="pi pi-folder-open"
          class="p-button-rounded p-button-text p-button-sm"
          severity="info"
          @click="$emit('load', diff)"
          v-tooltip.top="'Load in Merge View'"
        />
        <Button
          icon="pi pi-download"
          class="p-button-rounded p-button-text p-button-sm"
          severity="success"
          @click="$emit('export', diff)"
          v-tooltip.top="'Export as .txt'"
        />
        <Button
          icon="pi pi-trash"
          class="p-button-rounded p-button-text p-button-sm"
          severity="danger"
          @click="$emit('delete', diff)"
          v-tooltip.top="'Delete'"
        />
      </div>
    </template>