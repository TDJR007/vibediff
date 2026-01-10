<script setup lang="ts">
    import { computed, ref } from 'vue'
    import type { Change } from 'diff'
    import Checkbox from 'primevue/checkbox'
    
    interface Props {
      changes: Change[]
      interactive?: boolean
    }
    
    const props = withDefaults(defineProps<Props>(), {
      interactive: false
    })
    
    const emit = defineEmits<{
      acceptLeft: [hunkIndex: number]
      acceptRight: [hunkIndex: number]
    }>()
    
    // Track which side is selected per hunk (null = unselected, 'left' | 'right')
    const hunkSelections = ref<Map<number, 'left' | 'right'>>(new Map())
    
    // Group changes into proper hunks
    const hunks = computed(() => {
      const result: Array<{
        index: number
        changes: Change[]
        hasChanges: boolean
        leftContent: string
        rightContent: string
      }> = []
    
      let currentHunk: Change[] = []
      let hunkIndex = 0
      let inChangeBlock = false
    
      props.changes.forEach((change, idx) => {
        const isChange = change.added || change.removed
        
        if (isChange && !inChangeBlock) {
          inChangeBlock = true
          currentHunk = [change]
        } else if (isChange && inChangeBlock) {
          currentHunk.push(change)
        } else if (!isChange && inChangeBlock) {
          const leftContent = currentHunk.filter(c => c.removed).map(c => c.value).join('')
          const rightContent = currentHunk.filter(c => c.added).map(c => c.value).join('')
          
          result.push({
            index: hunkIndex++,
            changes: [...currentHunk],
            hasChanges: true,
            leftContent,
            rightContent
          })
          
          currentHunk = []
          inChangeBlock = false
        }
      })
    
      if (inChangeBlock && currentHunk.length > 0) {
        const leftContent = currentHunk.filter(c => c.removed).map(c => c.value).join('')
        const rightContent = currentHunk.filter(c => c.added).map(c => c.value).join('')
        
        result.push({
          index: hunkIndex++,
          changes: [...currentHunk],
          hasChanges: true,
          leftContent,
          rightContent
        })
      }
    
      return result
    })
    
    // Process into lines with hunk tracking
    const processedLines = computed(() => {
      const result: Array<{
        leftLineNum: number | null
        rightLineNum: number | null
        content: string
        type: 'equal' | 'add' | 'remove'
        hunkIndex: number | null
      }> = []
    
      let leftNum = 1
      let rightNum = 1
      let currentHunkIdx = 0
      let inChangeBlock = false
    
      props.changes.forEach((change, idx) => {
        const lines = change.value.split('\n')
        if (lines[lines.length - 1] === '') lines.pop()
    
        const isChange = change.added || change.removed
        
        if (isChange && !inChangeBlock) {
          inChangeBlock = true
        }
    
        lines.forEach((line) => {
          if (change.added) {
            result.push({
              leftLineNum: null,
              rightLineNum: rightNum++,
              content: line,
              type: 'add',
              hunkIndex: currentHunkIdx
            })
          } else if (change.removed) {
            result.push({
              leftLineNum: leftNum++,
              rightLineNum: null,
              content: line,
              type: 'remove',
              hunkIndex: currentHunkIdx
            })
          } else {
            result.push({
              leftLineNum: leftNum++,
              rightLineNum: rightNum++,
              content: line,
              type: 'equal',
              hunkIndex: null
            })
          }
        })
    
        const nextChange = props.changes[idx + 1]
        if (inChangeBlock && (!nextChange || (!nextChange.added && !nextChange.removed))) {
          currentHunkIdx++
          inChangeBlock = false
        }
      })
    
      return result
    })
    
    // Get first removed and first added line for each hunk (for checkbox placement)
    const hunkCheckboxLines = computed(() => {
      const map = new Map<number, { firstRemoved: number | null, firstAdded: number | null }>()
      
      processedLines.value.forEach((line, idx) => {
        if (line.hunkIndex !== null) {
          if (!map.has(line.hunkIndex)) {
            map.set(line.hunkIndex, { firstRemoved: null, firstAdded: null })
          }
          
          const entry = map.get(line.hunkIndex)!
          if (line.type === 'remove' && entry.firstRemoved === null) {
            entry.firstRemoved = idx
          }
          if (line.type === 'add' && entry.firstAdded === null) {
            entry.firstAdded = idx
          }
        }
      })
      
      return map
    })
    
    const handleCheckbox = (hunkIndex: number, side: 'left' | 'right') => {
      const current = hunkSelections.value.get(hunkIndex)
      
      // Toggle behavior: if already selected, deselect; otherwise select
      if (current === side) {
        hunkSelections.value.delete(hunkIndex)
      } else {
        hunkSelections.value.set(hunkIndex, side)
        
        if (side === 'left') {
          emit('acceptLeft', hunkIndex)
        } else {
          emit('acceptRight', hunkIndex)
        }
      }
    }
    </script>
    
    <template>
      <div class="diff-viewer border border-surface-300 dark:border-surface-700 rounded-lg overflow-hidden">
        <!-- Header -->
        <div class="bg-surface-100 dark:bg-surface-800 p-3 border-b border-surface-200 dark:border-surface-700">
          <h3 class="font-semibold text-sm">
            {{ interactive ? 'Differences Found - Check boxes to accept changes' : 'Differences Found' }}
          </h3>
        </div>
    
        <!-- Diff Content -->
        <div class="overflow-auto max-h-[600px] relative">
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
                <!-- Left checkbox column (for removed/original lines) -->
                <td class="w-8 text-center select-none border-r border-surface-200 dark:border-surface-700">
                  <Checkbox
                    v-if="interactive && line.type === 'remove' && line.hunkIndex !== null && hunkCheckboxLines.get(line.hunkIndex)?.firstRemoved === idx"
                    :modelValue="hunkSelections.get(line.hunkIndex) === 'left'"
                    :binary="true"
                    @update:modelValue="handleCheckbox(line.hunkIndex!, 'left')"
                    class="scale-75"
                    v-tooltip.right="'Accept original (left) version'"
                  />
                </td>
    
                <!-- Left line number -->
                <td class="w-12 text-right pr-4 py-1 text-surface-500 select-none border-r border-surface-200 dark:border-surface-700">
                  {{ line.leftLineNum }}
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
    
                <!-- Right line number -->
                <td class="w-12 text-right pr-4 py-1 text-surface-500 select-none border-r border-surface-200 dark:border-surface-700">
                  {{ line.rightLineNum }}
                </td>
    
                <!-- Right checkbox column (for added/modified lines) -->
                <td class="w-8 text-center select-none border-r border-surface-200 dark:border-surface-700">
                  <Checkbox
                    v-if="interactive && line.type === 'add' && line.hunkIndex !== null && hunkCheckboxLines.get(line.hunkIndex)?.firstAdded === idx"
                    :modelValue="hunkSelections.get(line.hunkIndex) === 'right'"
                    :binary="true"
                    @update:modelValue="handleCheckbox(line.hunkIndex!, 'right')"
                    class="scale-75"
                    v-tooltip.left="'Accept modified (right) version'"
                  />
                </td>
    
                <!-- Content -->
                <td class="px-4 py-1 whitespace-pre">{{ line.content || ' ' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
    
        <!-- Legend (if interactive) -->
        <div v-if="interactive" class="bg-surface-50 dark:bg-surface-900 p-3 border-t border-surface-200 dark:border-surface-700 text-xs text-surface-600 dark:text-surface-400">
          <div class="flex gap-6 items-center">
            <span class="font-semibold">Legend:</span>
            <span class="flex items-center gap-1">
              <span class="inline-block w-3 h-3 bg-red-200 dark:bg-red-900 rounded"></span>
              Red = Original (Left) - Check left checkbox to keep
            </span>
            <span class="flex items-center gap-1">
              <span class="inline-block w-3 h-3 bg-green-200 dark:bg-green-900 rounded"></span>
              Green = Modified (Right) - Check right checkbox to keep
            </span>
          </div>
        </div>
      </div>
    </template>
    
    <style scoped>
    .diff-viewer {
      font-size: 13px;
      line-height: 1.5;
    }
    </style>