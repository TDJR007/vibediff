import { ref, computed } from 'vue'
import * as Diff from 'diff' // Note: it's named Diff, not diff

export function useDiff() {
  const left = ref('')
  const right = ref('')
  const diffResult = ref<Diff.Change[]>([])

  const computeDiff = () => {
    if (!left.value || !right.value) {
      diffResult.value = []
      return
    }

    // Compute line-by-line diff (most common for code/text)
    diffResult.value = Diff.diffLines(left.value, right.value, {
      ignoreWhitespace: false, // change to true later if needed
    })
  }

  const hasDiff = computed(() => diffResult.value.length > 0)

  return {
    left,
    right,
    diffResult,
    computeDiff,
    hasDiff,
  }
}