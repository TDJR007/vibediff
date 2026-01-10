<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import type { Change } from 'diff'
import Button from 'primevue/button'
import Textarea from 'primevue/textarea'
import DiffViewer from '@/components/DiffViewer.vue'

const router = useRouter()

// Data passed from Home
const leftText = ref('')
const rightText = ref('')
const diffResult = ref<Change[]>([])

// Merged result - starts as a copy of right (modified) text
const mergedText = ref('')

// Track which hunks have been manually accepted (for UI feedback later if needed)
const acceptedHunks = ref<Set<number>>(new Set())

// Check if we have data
const hasData = computed(() => diffResult.value.length > 0)

// Conflict detection
const hasConflicts = computed(() => {
    return mergedText.value.includes('<<<<<<<') ||
        mergedText.value.includes('=======') ||
        mergedText.value.includes('>>>>>>>')
})

onMounted(() => {
    const storedData = sessionStorage.getItem('vibediff-merge-data')

    console.log('MergeView mounted, stored data exists:', !!storedData)

    if (storedData) {
        try {
            const data = JSON.parse(storedData)

            if (data.left && data.right && data.diff) {
                leftText.value = data.left
                rightText.value = data.right
                diffResult.value = data.diff
                mergedText.value = data.right // Start with modified version

                console.log('✅ Data loaded successfully')
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

// Helper: Get text content from a Change array
const getChangeText = (changes: Change[]) => {
    return changes.map(c => c.value).join('')
}

// Accept left (original) for a specific hunk
const acceptLeft = (hunkIndex: number) => {
    console.log('Accept Left clicked for hunk:', hunkIndex)

    // Rebuild merged text with this hunk using left (original) version
    rebuildMergedText(hunkIndex, 'left')
    acceptedHunks.value.add(hunkIndex)
}

// Accept right (modified) for a specific hunk
const acceptRight = (hunkIndex: number) => {
    console.log('Accept Right clicked for hunk:', hunkIndex)

    // Rebuild merged text with this hunk using right (modified) version
    rebuildMergedText(hunkIndex, 'right')
    acceptedHunks.value.add(hunkIndex)
}

// Keep both with conflict markers
const keepBoth = (hunkIndex: number) => {
    console.log('Keep Both clicked for hunk:', hunkIndex)

    rebuildMergedText(hunkIndex, 'both')
    acceptedHunks.value.add(hunkIndex)
}

// Rebuild the merged text based on user choice for a hunk
const rebuildMergedText = (targetHunkIndex: number, choice: 'left' | 'right' | 'both') => {
    let result = ''
    let currentHunkIndex = 0
    let inChangeBlock = false
    const processedHunks = new Set<number>()

    // First pass: identify all change blocks and their indices
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

    // Handle trailing change block
    if (inChangeBlock && tempChanges.length > 0) {
        changeBlocks.push({ hunkIndex: currentHunkIndex, changes: [...tempChanges] })
    }

    // Second pass: rebuild text
    currentHunkIndex = 0
    inChangeBlock = false

    diffResult.value.forEach((change, idx) => {
        const isChange = change.added || change.removed

        if (isChange && !inChangeBlock) {
            inChangeBlock = true
        }

        // Check if this is the target hunk
        if (currentHunkIndex === targetHunkIndex && isChange) {
            if (choice === 'left') {
                // ONLY include removed lines (original)
                if (change.removed) {
                    result += change.value
                }
                // Skip added lines completely
            } else if (choice === 'right') {
                // ONLY include added lines (modified)
                if (change.added) {
                    result += change.value
                }
                // Skip removed lines completely
            } else if (choice === 'both') {
                // Add conflict markers
                if (change.removed) {
                    result += '<<<<<<< HEAD (Original)\n' + change.value
                } else if (change.added) {
                    result += '=======\n' + change.value + '>>>>>>> Modified\n'
                }
            }
        } else if (!isChange) {
            // Unchanged lines - always keep
            result += change.value
        } else if (currentHunkIndex !== targetHunkIndex && isChange) {
            // Other hunks - keep default (modified/added version)
            if (change.added) {
                result += change.value
            }
        }

        // Check if we're at the end of a change block
        const nextChange = diffResult.value[idx + 1]
        if (inChangeBlock && (!nextChange || (!nextChange.added && !nextChange.removed))) {
            currentHunkIndex++
            inChangeBlock = false
        }
    })

    mergedText.value = result
}

const goBack = () => {
    router.push('/')
}

const exportMerged = () => {
    if (hasConflicts.value) {
        alert('⚠️ Cannot export - you still have conflict markers! Resolve them first.')
        return
    }

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

        <!-- Diff Viewer with interactive controls -->
        <DiffViewer
            :changes="diffResult"
            :interactive="true"
            @accept-left="acceptLeft"
            @accept-right="acceptRight" />

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