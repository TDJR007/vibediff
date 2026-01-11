<script setup lang="ts">
    import DiffLine from './DiffLine.vue'
    import type { DiffLine as DiffLineType } from '@/composables/useDiffSideBySide'
    
    defineProps<{
      title: string
      lines: DiffLineType[]
      interactive: boolean
      side: 'left' | 'right'
      hunkSelections: Map<number, { left: boolean, right: boolean, order: Array<'left' | 'right'> }>
    }>()
    
    defineEmits<{
      toggle: [hunkIndex: number, side: 'left' | 'right']
    }>()
    
    const isChecked = (line: DiffLineType, side: 'left' | 'right', selections: Map<number, any>) => {
      if (line.hunkIndex === null) return false
      const selection = selections.get(line.hunkIndex)
      return selection ? selection[side] || false : false
    }
    </script>
    
    <template>
      <div style="display: flex; flex-direction: column; height: 100%;">
        <div class="bg-surface-50 dark:bg-surface-900 p-2 text-xs font-semibold text-center border-b border-surface-200 dark:border-surface-700">
          {{ title }}
        </div>
        <div class="flex-1 overflow-auto">
          <table class="w-full text-sm font-mono">
            <tbody>
              <DiffLine
                v-for="(line, idx) in lines"
                :key="idx"
                :line="line"
                :interactive="interactive"
                :is-checked="isChecked(line, side, hunkSelections)"
                :side="side"
                @toggle="$emit('toggle', $event, side)"
              />
            </tbody>
          </table>
        </div>
      </div>
    </template>