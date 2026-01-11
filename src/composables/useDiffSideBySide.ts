// src/composables/useDiffSideBySide.ts
import { computed, type Ref } from 'vue'
import type { Change } from 'diff'

export interface DiffLine {
  lineNum: number
  content: string
  type: 'equal' | 'remove' | 'add'
  hunkIndex: number | null
  isFirstInHunk?: boolean
}

export function useDiffSideBySide(changes: Ref<Change[]>) {
  // Build side-by-side line arrays
  const sideBySideLines = computed(() => {
    const leftLines: DiffLine[] = []
    const rightLines: DiffLine[] = []

    let leftNum = 1
    let rightNum = 1
    let currentHunkIdx = 0
    let inChangeBlock = false

    changes.value.forEach((change, idx) => {
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

      const nextChange = changes.value[idx + 1]
      if (inChangeBlock && (!nextChange || (!nextChange.added && !nextChange.removed))) {
        currentHunkIdx++
        inChangeBlock = false
      }
    })

    return { leftLines, rightLines }
  })

  return {
    sideBySideLines
  }
}