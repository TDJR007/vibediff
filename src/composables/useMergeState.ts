// src/composables/useMergeState.ts
import { ref, computed } from 'vue'
import type { Change } from 'diff'

export function useMergeState(initialText: string) {
  const mergedText = ref(initialText)
  const acceptedHunks = ref<Set<number>>(new Set())
  
  const hasConflicts = computed(() => {
    return mergedText.value.includes('<<<<<<<') ||
      mergedText.value.includes('=======') ||
      mergedText.value.includes('>>>>>>>')
  })
  
  return {
    mergedText,
    acceptedHunks,
    hasConflicts
  }
}