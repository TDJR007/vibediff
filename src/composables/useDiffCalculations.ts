// src/composables/useDiffCalculations.ts
import { computed, type Ref } from 'vue'
import type { Change } from 'diff'

export function useDiffCalculations(changes: Ref<Change[]>) {
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

    changes.value.forEach((change, idx) => {
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

  return {
    hunks
  }
}