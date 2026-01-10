<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import type { Change } from 'diff'
import Button from 'primevue/button'
import Textarea from 'primevue/textarea'
import DiffViewer from '@/components/DiffViewer.vue'

const router = useRouter()

// Data passed from Home via router state
const leftText = ref('')
const rightText = ref('')
const diffResult = ref<Change[]>([])

// Merged result - starts as a copy of right (modified) text
const mergedText = ref('')

// Check if we have data (came from Home)
const hasData = computed(() => diffResult.value.length > 0)

// Conflict detection - look for git-style markers
const hasConflicts = computed(() => {
    return mergedText.value.includes('<<<<<<<') ||
        mergedText.value.includes('=======') ||
        mergedText.value.includes('>>>>>>>')
})

onMounted(() => {
  // Get data from sessionStorage
  const storedData = sessionStorage.getItem('vibediff-merge-data')
  
  console.log('MergeView mounted, stored data exists:', !!storedData) // Debug
  
  if (storedData) {
    try {
      const data = JSON.parse(storedData)
      
      if (data.left && data.right && data.diff) {
        leftText.value = data.left
        rightText.value = data.right
        diffResult.value = data.diff
        mergedText.value = data.right // Start with modified version
        
        console.log('✅ Data loaded successfully:', {
          leftLength: leftText.value.length,
          rightLength: rightText.value.length,
          diffLength: diffResult.value.length
        })
        
        // Clear the session storage after reading (optional, keeps it clean)
        sessionStorage.removeItem('vibediff-merge-data')
      } else {
        console.log('❌ Data incomplete, redirecting')
        router.push('/')
      }
    } catch (e) {
      console.error('Failed to parse merge data:', e)
      router.push('/')
    }
  } else {
    console.log('❌ No stored data found, redirecting to home')
    router.push('/')
  }
})

const goBack = () => {
    router.push('/')
}

const exportMerged = () => {
    if (hasConflicts.value) {
        alert('⚠️ Cannot export - you still have conflict markers! Resolve them first.')
        return
    }

    // Create a blob and download
    const blob = new Blob([mergedText.value], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `merged-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
}
</script>

<template>
    <div v-if="hasData" class="space-y-6">
        <div class="flex justify-between items-center">
            <h1 class="text-3xl font-bold">Merge Changes</h1>
            <Button
                label="Back to Home"
                icon="pi pi-arrow-left"
                severity="secondary"
                @click="goBack" />
        </div>

        <!-- Diff Viewer -->
        <DiffViewer :changes="diffResult" />

        <!-- Merged Result Section -->
        <div class="space-y-3">
            <div class="flex justify-between items-center">
                <h2 class="text-xl font-semibold">Final Merged Result</h2>
                <div v-if="hasConflicts" class="text-red-600 dark:text-red-400 text-sm font-medium">
                    ⚠️ Conflict markers detected! Edit below to resolve.
                </div>
            </div>

            <!-- Editable merged text -->
            <div class="border border-surface-300 dark:border-surface-700 rounded-lg overflow-hidden">
                <Textarea
                    v-model="mergedText"
                    class="w-full font-mono text-sm border-0"
                    :rows="20"
                    placeholder="Your merged result will appear here..."
                    style="resize: vertical;" />
            </div>

            <!-- Action buttons -->
            <div class="flex gap-3 justify-end">
                <Button
                    label="Export as .txt"
                    icon="pi pi-download"
                    :disabled="hasConflicts"
                    @click="exportMerged" />
            </div>
        </div>
    </div>
</template>