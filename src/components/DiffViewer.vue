<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Change } from 'diff'
import Checkbox from 'primevue/checkbox'
import Splitter from 'primevue/splitter'
import SplitterPanel from 'primevue/splitterpanel'

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

// Track selections per hunk - now supports both!
// Structure: Map<hunkIndex, { left: boolean, right: boolean, order: Array<'left' | 'right'> }>
const hunkSelections = ref<Map<number, { left: boolean, right: boolean, order: Array<'left' | 'right'> }>>(new Map())

// Group changes into proper hunks
const hunks = computed(() => {
  const result: Array<{
    index: number
    changes: Change[]
    leftLines: string[]
    rightLines: string[]
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
      // Extract lines for left and right
      const leftLines = currentHunk
        .filter(c => c.removed)
        .flatMap(c => c.value.split('\n').filter(l => l !== ''))

      const rightLines = currentHunk
        .filter(c => c.added)
        .flatMap(c => c.value.split('\n').filter(l => l !== ''))

      result.push({
        index: hunkIndex++,
        changes: [...currentHunk],
        leftLines,
        rightLines
      })

      currentHunk = []
      inChangeBlock = false
    }
  })

  // Handle trailing change block
  if (inChangeBlock && currentHunk.length > 0) {
    const leftLines = currentHunk
      .filter(c => c.removed)
      .flatMap(c => c.value.split('\n').filter(l => l !== ''))

    const rightLines = currentHunk
      .filter(c => c.added)
      .flatMap(c => c.value.split('\n').filter(l => l !== ''))

    result.push({
      index: hunkIndex++,
      changes: [...currentHunk],
      leftLines,
      rightLines
    })
  }

  return result
})

// Build side-by-side line arrays
const sideBySideLines = computed(() => {
  const leftLines: Array<{
    lineNum: number
    content: string
    type: 'equal' | 'remove'
    hunkIndex: number | null
    isFirstInHunk?: boolean
  }> = []

  const rightLines: Array<{
    lineNum: number
    content: string
    type: 'equal' | 'add'
    hunkIndex: number | null
    isFirstInHunk?: boolean
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

    if (change.removed) {
      // Add to left side
      lines.forEach((line, lineIdx) => {
        leftLines.push({
          lineNum: leftNum++,
          content: line,
          type: 'remove',
          hunkIndex: currentHunkIdx,
          isFirstInHunk: lineIdx === 0
        })
      })

      // Add empty placeholders to right side to keep alignment
      lines.forEach(() => {
        rightLines.push({
          lineNum: 0, // placeholder
          content: '',
          type: 'equal',
          hunkIndex: null
        })
      })
    } else if (change.added) {
      // Add empty placeholders to left side
      lines.forEach(() => {
        leftLines.push({
          lineNum: 0, // placeholder
          content: '',
          type: 'equal',
          hunkIndex: null
        })
      })

      // Add to right side
      lines.forEach((line, lineIdx) => {
        rightLines.push({
          lineNum: rightNum++,
          content: line,
          type: 'add',
          hunkIndex: currentHunkIdx,
          isFirstInHunk: lineIdx === 0
        })
      })
    } else {
      // Unchanged - add to both sides
      lines.forEach((line) => {
        leftLines.push({
          lineNum: leftNum++,
          content: line,
          type: 'equal',
          hunkIndex: null
        })

        rightLines.push({
          lineNum: rightNum++,
          content: line,
          type: 'equal',
          hunkIndex: null
        })
      })
    }

    const nextChange = props.changes[idx + 1]
    if (inChangeBlock && (!nextChange || (!nextChange.added && !nextChange.removed))) {
      currentHunkIdx++
      inChangeBlock = false
    }
  })

  return { leftLines, rightLines }
})

const handleCheckbox = (hunkIndex: number, side: 'left' | 'right') => {
  const current = hunkSelections.value.get(hunkIndex) || { left: false, right: false, order: [] }

  if (side === 'left') {
    if (current.left) {
      // Deselecting left
      current.left = false
      current.order = current.order.filter(s => s !== 'left')
    } else {
      // Selecting left
      current.left = true
      current.order.push('left')
    }
  } else {
    if (current.right) {
      // Deselecting right
      current.right = false
      current.order = current.order.filter(s => s !== 'right')
    } else {
      // Selecting right
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
        <SplitterPanel :size="50" style="display: flex; flex-direction: column; height: 100%;">
          <div
            class="bg-surface-50 dark:bg-surface-900 p-2 text-xs font-semibold text-center border-b border-surface-200 dark:border-surface-700">
            Original (Left)
          </div>
          <div class="flex-1 overflow-auto">
            <table class="w-full text-sm font-mono">
              <tbody>
                <tr
                  v-for="(line, idx) in sideBySideLines.leftLines"
                  :key="idx"
                  :style="{
                    backgroundColor: line.type === 'remove' ? 'rgba(239, 68, 68, 0.2)' : 'transparent'
                  }"
                  class="hover:opacity-80 transition-opacity">
                  <!-- Checkbox column -->
                  <td class="w-8 text-center select-none border-r border-surface-200 dark:border-surface-700">
                    <Checkbox
                      v-if="interactive && line.type === 'remove' && line.isFirstInHunk && line.hunkIndex !== null"
                      :modelValue="hunkSelections.get(line.hunkIndex)?.left || false"
                      :binary="true"
                      @update:modelValue="handleCheckbox(line.hunkIndex!, 'left')"
                      class="scale-75"
                      v-tooltip.right="'Accept original (left) version'" />
                  </td>

                  <!-- Line number -->
                  <td
                    class="w-12 text-right pr-4 py-1 text-surface-500 select-none border-r border-surface-200 dark:border-surface-700">
                    {{ line.lineNum || '' }}
                  </td>

                  <!-- Content -->
                  <td class="px-4 py-1 whitespace-pre">{{ line.content || ' ' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </SplitterPanel>

        <!-- Right Panel (Modified) -->
        <SplitterPanel :size="50" style="display: flex; flex-direction: column; height: 100%;">
          <div
            class="bg-surface-50 dark:bg-surface-900 p-2 text-xs font-semibold text-center border-b border-surface-200 dark:border-surface-700">
            Modified (Right)
          </div>
          <div class="flex-1 overflow-auto">
            <table class="w-full text-sm font-mono">
              <tbody>
                <tr
                  v-for="(line, idx) in sideBySideLines.rightLines"
                  :key="idx"
                  :style="{
                    backgroundColor: line.type === 'add' ? 'rgba(34, 197, 94, 0.2)' : 'transparent'
                  }"
                  class="hover:opacity-80 transition-opacity">
                  <!-- Checkbox column -->
                  <td class="w-8 text-center select-none border-r border-surface-200 dark:border-surface-700">
                    <Checkbox
                      v-if="interactive && line.type === 'add' && line.isFirstInHunk && line.hunkIndex !== null"
                      :modelValue="hunkSelections.get(line.hunkIndex)?.right || false"
                      :binary="true"
                      @update:modelValue="handleCheckbox(line.hunkIndex!, 'right')"
                      class="scale-75"
                      v-tooltip.left="'Accept modified (right) version'" />
                  </td>

                  <!-- Line number -->
                  <td
                    class="w-12 text-right pr-4 py-1 text-surface-500 select-none border-r border-surface-200 dark:border-surface-700">
                    {{ line.lineNum || '' }}
                  </td>

                  <!-- Content -->
                  <td class="px-4 py-1 whitespace-pre">{{ line.content || ' ' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </SplitterPanel>
      </Splitter>
    </div>

    <!-- Legend -->
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
  </div>
</template>

<style scoped>
.diff-viewer {
  font-size: 13px;
  line-height: 1.5;
}
</style>