<script setup lang="ts">
    import Checkbox from 'primevue/checkbox'
    import type { DiffLine } from '@/composables/useDiffSideBySide'
    
    defineProps<{
      line: DiffLine
      interactive: boolean
      isChecked: boolean
      side: 'left' | 'right'
    }>()
    
    defineEmits<{
      toggle: [hunkIndex: number, side: 'left' | 'right']
    }>()
    
    const getBackgroundColor = (type: string) => {
      if (type === 'remove') return 'rgba(239, 68, 68, 0.2)'
      if (type === 'add') return 'rgba(34, 197, 94, 0.2)'
      return 'transparent'
    }
    
    const getTooltip = (side: 'left' | 'right') => {
      return side === 'left' 
        ? 'Accept original (left) version'
        : 'Accept modified (right) version'
    }
    </script>
    
    <template>
      <tr
        :style="{ backgroundColor: getBackgroundColor(line.type) }"
        class="hover:opacity-80 transition-opacity">
        <!-- Checkbox column -->
        <td class="w-8 text-center select-none border-r border-surface-200 dark:border-surface-700">
          <Checkbox
            v-if="interactive && 
                  ((side === 'left' && line.type === 'remove') || 
                   (side === 'right' && line.type === 'add')) && 
                  line.isFirstInHunk && 
                  line.hunkIndex !== null"
            :modelValue="isChecked"
            :binary="true"
            @update:modelValue="$emit('toggle', line.hunkIndex!, side)"
            class="scale-75"
            :v-tooltip="side === 'right' ? { value: getTooltip(side), position: 'left' } : { value: getTooltip(side), position: 'right' }" />
        </td>
    
        <!-- Line number -->
        <td class="w-12 text-right pr-4 py-1 text-surface-500 select-none border-r border-surface-200 dark:border-surface-700">
          {{ line.lineNum || '' }}
        </td>
    
        <!-- Content -->
        <td class="px-4 py-1 whitespace-pre">{{ line.content || ' ' }}</td>
      </tr>
    </template>