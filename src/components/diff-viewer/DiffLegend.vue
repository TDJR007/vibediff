<script setup lang="ts">
    defineProps<{
      interactive: boolean
    }>()
    </script>
    
    <template>
      <div v-if="interactive"
        class="bg-surface-50 dark:bg-surface-900 p-3 border-t border-surface-200 dark:border-surface-700 text-xs text-surface-600 dark:text-surface-400">
        <div class="flex gap-6 items-center">
          <span class="font-semibold">Legend:</span>
          <span class="flex items-center gap-1">
            <span class="inline-block w-3 h-3 bg-red-200 dark:bg-red-900 rounded"></span>
            Red = Removed in original
          </span>
          <span class="flex items-center gap-1">
            <span class="inline-block w-3 h-3 bg-green-200 dark:bg-green-900 rounded"></span>
            Green = Added in modified
          </span>
        </div>
      </div>
    </template>