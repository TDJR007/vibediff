<script setup lang="ts">
  import { ref, toRef } from 'vue'
  import type { Change } from 'diff'
  import Splitter from 'primevue/splitter'
  import SplitterPanel from 'primevue/splitterpanel'
  import { useDiffCalculations } from '@/composables/useDiffCalculations'
  import { useDiffSideBySide } from '@/composables/useDiffSideBySide'
  import DiffSidePanel from './diff-viewer/DiffSidePanel.vue'
  import DiffLegend from './diff-viewer/DiffLegend.vue'
  
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
    acceptBoth: [hunkIndex: number, order: Array<'left' | 'right'>]
  }>()
  
  // Track selections per hunk
  const hunkSelections = ref<Map<number, { left: boolean, right: boolean, order: Array<'left' | 'right'> }>>(new Map())
  
  // Convert props.changes to ref for composables
  const changesRef = toRef(props, 'changes')
  
  // Use composables for calculations
  const { hunks } = useDiffCalculations(changesRef)
  const { sideBySideLines } = useDiffSideBySide(changesRef)
  
  const handleCheckbox = (hunkIndex: number, side: 'left' | 'right') => {
    const current = hunkSelections.value.get(hunkIndex) || { left: false, right: false, order: [] }
  
    if (side === 'left') {
      if (current.left) {
        current.left = false
        current.order = current.order.filter(s => s !== 'left')
      } else {
        current.left = true
        current.order.push('left')
      }
    } else {
      if (current.right) {
        current.right = false
        current.order = current.order.filter(s => s !== 'right')
      } else {
        current.right = true
        current.order.push('right')
      }
    }
  
    // Update the map
    if (current.order.length === 0) {
      hunkSelections.value.delete(hunkIndex)
    } else {
      hunkSelections.value.set(hunkIndex, current)
    }
  
    // Emit event with the full selection state
    if (current.left && current.right) {
      emit('acceptBoth', hunkIndex, current.order)
    } else if (current.left) {
      emit('acceptLeft', hunkIndex)
    } else if (current.right) {
      emit('acceptRight', hunkIndex)
    }
  }
  
  // Expose selections so parent can access them
  defineExpose({
    hunkSelections
  })
  </script>
  
  <template>
    <div class="diff-viewer border border-surface-300 dark:border-surface-700 rounded-lg overflow-hidden">
      <!-- Header -->
      <div class="bg-surface-100 dark:bg-surface-800 p-3 border-b border-surface-200 dark:border-surface-700">
        <h3 class="font-semibold text-sm">
          {{ interactive ? 'Side-by-Side Comparison - Check boxes to accept changes' : 'Side-by-Side Comparison' }}
        </h3>
      </div>
  
      <!-- Side-by-Side Content -->
      <div style="height: 600px;">
        <Splitter layout="horizontal" style="height: 100%;">
          <!-- Left Panel (Original) -->
          <SplitterPanel :size="50">
            <DiffSidePanel
              title="Original (Left)"
              :lines="sideBySideLines.leftLines"
              :interactive="interactive"
              side="left"
              :hunk-selections="hunkSelections"
              @toggle="handleCheckbox"
            />
          </SplitterPanel>
  
          <!-- Right Panel (Modified) -->
          <SplitterPanel :size="50">
            <DiffSidePanel
              title="Modified (Right)"
              :lines="sideBySideLines.rightLines"
              :interactive="interactive"
              side="right"
              :hunk-selections="hunkSelections"
              @toggle="handleCheckbox"
            />
          </SplitterPanel>
        </Splitter>
      </div>
  
      <!-- Legend -->
      <DiffLegend :interactive="interactive" />
    </div>
  </template>
  
  <style scoped>
  .diff-viewer {
    font-size: 13px;
    line-height: 1.5;
  }
  </style>