// src/composables/useMergeActions.ts
import { type Ref } from 'vue'
import type { Change } from 'diff'
import { useToast } from 'primevue/usetoast'

export function useMergeActions(
  mergedText: Ref<string>,
  diffResult: Ref<Change[]>,
  leftText: Ref<string>,
  rightText: Ref<string>,
  acceptedHunks: Ref<Set<number>>
) {
  const toast = useToast()
  
  // Rebuild the merged text based on user choice for a hunk
  const rebuildMergedText = (targetHunkIndex: number, choice: 'left' | 'right' | 'both', order?: Array<'left' | 'right'>) => {
    let result = ''
    let currentHunkIndex = 0
    let inChangeBlock = false
    const processedHunks = new Set<number>()

    // First pass: identify all change blocks
    const changeBlocks: Array<{ hunkIndex: number, changes: Change[] }> = []
    let tempChanges: Change[] = []

    diffResult.value.forEach((change, idx) => {
      const isChange = change.added || change.removed

      if (isChange) {
        if (!inChangeBlock) {
          inChangeBlock = true
          tempChanges = [change]
        } else {
          tempChanges.push(change)
        }
      } else if (inChangeBlock) {
        changeBlocks.push({ hunkIndex: currentHunkIndex++, changes: [...tempChanges] })
        tempChanges = []
        inChangeBlock = false
      }
    })

    if (inChangeBlock && tempChanges.length > 0) {
      changeBlocks.push({ hunkIndex: currentHunkIndex, changes: [...tempChanges] })
    }

    // Second pass: rebuild text
    currentHunkIndex = 0
    inChangeBlock = false
    let skipUntilNextUnchanged = false

    diffResult.value.forEach((change, idx) => {
      const isChange = change.added || change.removed

      if (isChange && !inChangeBlock) {
        inChangeBlock = true

        // Check if this is the target hunk with "both" choice
        if (currentHunkIndex === targetHunkIndex && choice === 'both' && order) {
          // Process the entire hunk at once
          const block = changeBlocks.find(b => b.hunkIndex === targetHunkIndex)
          if (block) {
            const removedText = block.changes.filter(c => c.removed).map(c => c.value).join('')
            const addedText = block.changes.filter(c => c.added).map(c => c.value).join('')

            // Add in the order user clicked
            order.forEach(side => {
              if (side === 'left' && removedText) {
                result += removedText
              } else if (side === 'right' && addedText) {
                result += addedText
              }
            })

            processedHunks.add(targetHunkIndex)
            skipUntilNextUnchanged = true
          }
        }
      }

      // Skip processing individual changes if we already processed this hunk
      if (skipUntilNextUnchanged && isChange) {
        // Just skip this change
      } else if (currentHunkIndex === targetHunkIndex && isChange && !processedHunks.has(targetHunkIndex)) {
        // Single selection (left or right only)
        if (choice === 'left') {
          if (change.removed) {
            result += change.value
          }
        } else if (choice === 'right') {
          if (change.added) {
            result += change.value
          }
        }
      } else if (!isChange) {
        result += change.value
        skipUntilNextUnchanged = false // Reset the skip flag
      } else if (currentHunkIndex !== targetHunkIndex && isChange) {
        // Other hunks - keep default (modified/added version)
        if (change.added) {
          result += change.value
        }
      }

      // Move to next hunk at change boundaries
      const nextChange = diffResult.value[idx + 1]
      if (inChangeBlock && (!nextChange || (!nextChange.added && !nextChange.removed))) {
        currentHunkIndex++
        inChangeBlock = false
      }
    })

    mergedText.value = result
  }
  
  // Accept left (original) for a specific hunk
  const acceptLeft = (hunkIndex: number) => {
    console.log('Accept Left clicked for hunk:', hunkIndex)
    rebuildMergedText(hunkIndex, 'left')
    acceptedHunks.value.add(hunkIndex)
  }

  // Accept right (modified) for a specific hunk
  const acceptRight = (hunkIndex: number) => {
    console.log('Accept Right clicked for hunk:', hunkIndex)
    rebuildMergedText(hunkIndex, 'right')
    acceptedHunks.value.add(hunkIndex)
  }

  // Accept both (in order)
  const acceptBoth = (hunkIndex: number, order: Array<'left' | 'right'>) => {
    console.log('Accept Both clicked for hunk:', hunkIndex, 'order:', order)
    rebuildMergedText(hunkIndex, 'both', order)
    acceptedHunks.value.add(hunkIndex)
  }

  // Accept all left (entire original version)
  const acceptAllLeft = () => {
    mergedText.value = leftText.value
    toast.add({
      severity: 'info',
      summary: 'Accepted All Original',
      detail: 'Using the entire left/original version.',
      life: 3000
    })
  }

  // Accept all right (entire modified version)
  const acceptAllRight = () => {
    mergedText.value = rightText.value
    toast.add({
      severity: 'info',
      summary: 'Accepted All Modified',
      detail: 'Using the entire right/modified version.',
      life: 3000
    })
  }
  
  return {
    acceptLeft,
    acceptRight,
    acceptBoth,
    acceptAllLeft,
    acceptAllRight
  }
}