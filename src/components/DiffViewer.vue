<script setup lang="ts">
    import { computed } from 'vue'
    import type { Change } from 'diff'
    
    interface Props {
      changes: Change[]
    }
    
    const props = defineProps<Props>()
    
    // Process changes into a format easier to render
    const processedLines = computed(() => {
      const result: Array<{
        leftLineNum: number | null
        rightLineNum: number | null
        content: string
        type: 'equal' | 'add' | 'remove'
      }> = []
    
      let leftNum = 1
      let rightNum = 1
    
      props.changes.forEach((change) => {
        const lines = change.value.split('\n')
        // Remove last empty line if it exists (split artifact)
        if (lines[lines.length - 1] === '') lines.pop()
    
        lines.forEach((line) => {
          if (change.added) {
            result.push({
              leftLineNum: null,
              rightLineNum: rightNum++,
              content: line,
              type: 'add'
            })
          } else if (change.removed) {
            result.push({
              leftLineNum: leftNum++,
              rightLineNum: null,
              content: line,
              type: 'remove'
            })
          } else {
            result.push({
              leftLineNum: leftNum++,
              rightLineNum: rightNum++,
              content: line,
              type: 'equal'
            })
          }
        })
      })
    
      return result
    })
    </script>
    
    <template>
        <div class="diff-viewer border border-surface-300 dark:border-surface-700 rounded-lg overflow-hidden">
          <!-- Header -->
          <div class="bg-surface-100 dark:bg-surface-800 p-3 border-b border-surface-200 dark:border-surface-700">
            <h3 class="font-semibold text-sm">Differences Found</h3>
          </div>
      
          <!-- Diff Content -->
          <div class="overflow-auto max-h-[600px]">
            <table class="w-full text-sm font-mono">
              <tbody>
                <tr
                  v-for="(line, idx) in processedLines"
                  :key="idx"
                  :style="{
                   backgroundColor: line.type === 'remove' ? 'rgba(239, 68, 68, 0.2)' : 
                 line.type === 'add' ? 'rgba(34, 197, 94, 0.2)' : 
                 'transparent'
                  }"
                  class="hover:opacity-80 transition-opacity"
                >
                  <!-- Left line number -->
                  <td class="w-12 text-right pr-4 py-1 text-surface-500 select-none border-r border-surface-200 dark:border-surface-700">
                    {{ line.leftLineNum }}
                  </td>
                  
                  <!-- Right line number -->
                  <td class="w-12 text-right pr-4 py-1 text-surface-500 select-none border-r border-surface-200 dark:border-surface-700">
                    {{ line.rightLineNum }}
                  </td>
      
                  <!-- Change indicator -->
                  <td 
                    class="w-8 text-center py-1 select-none border-r border-surface-200 dark:border-surface-700 font-bold"
                    :style="{
                      color: line.type === 'add' ? '#22c55e' : line.type === 'remove' ? '#ef4444' : 'transparent'
                    }"
                  >
                    <span v-if="line.type === 'add'">+</span>
                    <span v-if="line.type === 'remove'">-</span>
                  </td>
      
                  <!-- Content -->
                  <td class="px-4 py-1 whitespace-pre">{{ line.content || ' ' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>
    
    <style scoped>
    .diff-viewer {
      font-size: 13px;
      line-height: 1.5;
    }
    </style>